// src/worker.js
const os = require('node:os');
const tmpUi = require('node:path').join(os.tmpdir(), 'wa_ui.xml');
const { db, now } = require('./db');
const queue = require('./queue');
const adb = require('./adapter/adb');
const wa = require('./adapter/whatsapp-ui');
const notif = require('./adapter/notifications');
const webhook = require('./webhook');

const INSTANCE_ID = 'bs-local-1';

function ensureInstance() {
  const row = db.prepare('SELECT id FROM instances WHERE id=?').get(INSTANCE_ID);
  if (!row) {
    db.prepare('INSERT INTO instances (id, name, adb_serial, status, created_at) VALUES (?,?,?,?,?)')
      .run(INSTANCE_ID, 'BlueStacks Local', config.adbSerial, 'unknown', now());
  }
}

// Dedup: track last seen notification signatures
const seen = new Set();

async function handleCommand(cmd) {
  if (cmd.type === 'send_text') {
    const { to, body } = cmd.payload;
    const url = `https://wa.me/${to}?text=${encodeURIComponent(body)}`;
    const r = adb.shell(`am start -a android.intent.action.VIEW -d "${url}"`);
    if (!r.ok) throw new Error(r.stderr || 'am start failed');
    await new Promise((res) => setTimeout(res, 5000));
    adb.shell('uiautomator dump /sdcard/ui.xml');
    await new Promise((res) => setTimeout(res, 2000));
    let sent = false;
    try {
      const fs = require('node:fs');
      const xml = fs.readFileSync(tmpUi, 'utf8') || '';
      // try reading from device pull path
    } catch (e) {}
    // pull ui.xml
    adb.pullFile('/sdcard/ui.xml', tmpUi);
    await new Promise((res) => setTimeout(res, 500));
    try {
      const fs = require('node:fs');
      const xml = fs.readFileSync(tmpUi, 'utf8');
      const node = wa.findNodeByResourceId(xml, wa.SELECTORS.sendButton);
      if (node) {
        adb.shell(`input tap ${node.center[0]} ${node.center[1]}`);
        sent = true;
      }
    } catch (e) {
      // ignore
    }
    if (!sent) adb.shell('input keyevent 66');
    return { command: 'send_attempt', to, sent, observed: sent ? 'tap_executed' : 'fallback_enter', note: 'Envio observado como acao executada; confirmacao de entrega requer poll de UI.' };
  }
  if (cmd.type === 'health_check') {
    const online = adb.isDeviceOnline();
    const ver = adb.getProp('ro.build.version.release');
    db.prepare('UPDATE instances SET status=?, last_seen_at=? WHERE id=?').run(online ? 'online' : 'offline', now(), INSTANCE_ID);
    return { online, android: ver };
  }
  throw new Error(`Unknown command type: ${cmd.type}`);
}

async function pollReceived() {
  const r = notif.getWhatsAppNotifications();
  if (!r.ok) return;
  for (const n of r.notifications) {
    const sig = `${n.title || ''}|${n.text || ''}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    // persist message (in) — best effort, number may be missing
    const msgId = require('node:crypto').randomUUID();
    db.prepare(`INSERT INTO messages (id, instance_id, direction, from_number, body, status, observed_status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(msgId, INSTANCE_ID, 'in', n.title || null, n.text || null, 'received', 'notification', now(), now());
    // create event
    const eventId = require('node:crypto').randomUUID();
    const payload = { id: eventId, instance_id: INSTANCE_ID, from: n.title, body: n.text, origin: 'notification', reliability: 'partial', missing_fields: ['number_verification', 'timestamp', 'direction_confirmed'] };
    db.prepare('INSERT INTO events (id, instance_id, type, payload, webhook_status, created_at) VALUES (?,?,?,?,?,?)')
      .run(eventId, INSTANCE_ID, 'message.received', JSON.stringify(payload), 'pending', now());
    // deliver to webhooks
    const hooks = db.prepare('SELECT * FROM webhooks WHERE active=1').all();
    for (const h of hooks) {
      const res = await webhook.deliver(h.url, payload, h.secret);
      db.prepare('UPDATE events SET webhook_status=?, attempts=attempts+1 WHERE id=?').run(res.ok ? 'delivered' : 'failed', eventId);
    }
  }
}

async function loop() {
  ensureInstance();
  console.log(`[worker] started, instance=${INSTANCE_ID}, adb=${config.adbSerial}`);
  let lastReceive = 0;
  while (true) {
    try {
      const cmd = queue.dequeue(INSTANCE_ID);
      if (cmd) {
        console.log(`[worker] processing ${cmd.id} type=${cmd.type}`);
        try {
          const result = await handleCommand(cmd);
          queue.markDone(cmd.id, result);
          if (cmd.payload && cmd.payload.message_id) {
            const status = (result.sent) ? 'sent_uncertain' : 'queued';
            db.prepare('UPDATE messages SET status=?, observed_status=?, updated_at=? WHERE id=?')
              .run(status, result.observed || 'action_executed', now(), cmd.payload.message_id);
          }
          console.log(`[worker] done ${cmd.id}`);
        } catch (e) {
          console.error(`[worker] failed ${cmd.id}:`, e.message);
          queue.markFailed(cmd.id, e.message, true);
          if (cmd.payload && cmd.payload.message_id) {
            db.prepare('UPDATE messages SET status=?, error=?, updated_at=? WHERE id=?')
              .run('failed', e.message, now(), cmd.payload.message_id);
          }
        }
      }
      // Receive poll every 5s
      if (Date.now() - lastReceive > 5000) {
        lastReceive = Date.now();
        await pollReceived();
      }
    } catch (e) {
      console.error('[worker] loop error:', e.message);
    }
    await new Promise((res) => setTimeout(res, config.pollIntervalMs));
  }
}

loop().catch((e) => { console.error(e); process.exit(1); });
