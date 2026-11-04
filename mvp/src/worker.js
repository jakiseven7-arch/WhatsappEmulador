// src/worker.js
const config = require('./config');
const { db, now } = require('./db');
const queue = require('./queue');
const adb = require('./adapter/adb');
const wa = require('./adapter/whatsapp-ui');

const INSTANCE_ID = 'bs-local-1';

function ensureInstance() {
  const row = db.prepare('SELECT id FROM instances WHERE id=?').get(INSTANCE_ID);
  if (!row) {
    db.prepare('INSERT INTO instances (id, name, adb_serial, status, created_at) VALUES (?,?,?,?,?)')
      .run(INSTANCE_ID, 'BlueStacks Local', config.adbSerial, 'unknown', now());
  }
}

async function handleCommand(cmd) {
  if (cmd.type === 'send_text') {
    const { to, body } = cmd.payload;
    const url = `https://wa.me/${to}?text=${encodeURIComponent(body)}`;
    const r = adb.shell(`am start -a android.intent.action.VIEW -d "${url}"`);
    if (!r.ok) throw new Error(r.stderr || 'am start failed');
    await new Promise((res) => setTimeout(res, 5000));
    // Dump UI and find send button
    adb.shell('uiautomator dump /sdcard/ui.xml');
    await new Promise((res) => setTimeout(res, 2000));
    const pull = adb.pullFile('/sdcard/ui.xml', '/tmp/ui.xml');
    let sent = false;
    try {
      const fs = require('node:fs');
      const xml = fs.readFileSync('/tmp/ui.xml', 'utf8');
      const node = wa.findNodeByResourceId(xml, wa.SELECTORS.sendButton);
      if (node) {
        adb.shell(`input tap ${node.center[0]} ${node.center[1]}`);
        sent = true;
      }
    } catch (e) {
      // fallback
    }
    if (!sent) {
      adb.shell('input keyevent 66');
    }
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

async function loop() {
  ensureInstance();
  console.log(`[worker] started, instance=${INSTANCE_ID}, adb=${config.adbSerial}`);
  while (true) {
    try {
      const cmd = queue.dequeue(INSTANCE_ID);
      if (cmd) {
        console.log(`[worker] processing ${cmd.id} type=${cmd.type}`);
        try {
          const result = await handleCommand(cmd);
          queue.markDone(cmd.id, result);
          if (cmd.payload && cmd.payload.message_id) {
            const status = result.sent ? 'sent_uncertain' : 'queued';
            db.prepare('UPDATE messages SET status=?, observed_status=?, updated_at=? WHERE id=?')
              .run(status, result.observed, now(), cmd.payload.message_id);
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
    } catch (e) {
      console.error('[worker] loop error:', e.message);
    }
    await new Promise((res) => setTimeout(res, config.pollIntervalMs));
  }
}

loop().catch((e) => { console.error(e); process.exit(1); });
