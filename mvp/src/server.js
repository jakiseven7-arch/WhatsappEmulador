// src/server.js
const http = require('node:http');
const crypto = require('node:crypto');
const config = require('./config');
const { db, now } = require('./db');
const queue = require('./queue');
const adb = require('./adapter/adb');
const webhook = require('./webhook');

const INSTANCE_ID = 'bs-local-1';

function ensureInstance() {
  const row = db.prepare('SELECT id FROM instances WHERE id=?').get(INSTANCE_ID);
  if (!row) {
    db.prepare('INSERT INTO instances (id, name, adb_serial, status, created_at) VALUES (?,?,?,?,?)')
      .run(INSTANCE_ID, 'BlueStacks Local', config.adbSerial, 'unknown', now());
  }
}
ensureInstance();

function auth(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : req.headers['x-api-key'];
  return token === config.apiKey;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const routes = {
  'GET /health': async (req, res) => {
    send(res, 200, { status: 'ok', time: now() });
  },
  'GET /instances': async (req, res) => {
    const rows = db.prepare('SELECT * FROM instances').all();
    send(res, 200, { instances: rows });
  },
  'GET /instances/:id/status': async (req, res, params) => {
    const row = db.prepare('SELECT * FROM instances WHERE id=?').get(params.id);
    if (!row) return send(res, 404, { error: 'instance not found' });
    const online = adb.isDeviceOnline();
    db.prepare('UPDATE instances SET status=?, last_seen_at=? WHERE id=?').run(online ? 'online' : 'offline', now(), params.id);
    send(res, 200, { ...row, status: online ? 'online' : 'offline', adb_online: online, android: adb.getProp('ro.build.version.release') });
  },
  'POST /instances/:id/pause': async (req, res, params) => {
    db.prepare('UPDATE instances SET paused=1 WHERE id=?').run(params.id);
    send(res, 200, { id: params.id, paused: true });
  },
  'POST /instances/:id/resume': async (req, res, params) => {
    db.prepare('UPDATE instances SET paused=0 WHERE id=?').run(params.id);
    send(res, 200, { id: params.id, paused: false });
  },
  'POST /messages/text': async (req, res) => {
    const body = await readBody(req);
    const { instance_id, to, body: text, idempotency_key, correlation_id } = body;
    if (!instance_id || !to || !text) return send(res, 400, { error: 'instance_id, to, body required' });
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO messages (id, instance_id, direction, to_number, body, status, idempotency_key, correlation_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, instance_id, 'out', to, text, 'queued', idempotency_key || null, correlation_id || null, now(), now());
    const cmdId = queue.enqueue(instance_id, 'send_text', { to, body: text, message_id: id }, idempotency_key);
    send(res, 202, { message_id: id, command_id: cmdId, status: 'queued' });
  },
  'POST /messages/media': async (req, res) => {
    const body = await readBody(req);
    send(res, 501, { error: 'media not implemented in MVP', received: body });
  },
  'GET /messages/:id': async (req, res, params) => {
    const row = db.prepare('SELECT * FROM messages WHERE id=?').get(params.id);
    if (!row) return send(res, 404, { error: 'message not found' });
    send(res, 200, row);
  },
  'GET /instances/:id/notifications': async (req, res, params) => {
    const notif = require('./adapter/notifications');
    const r = notif.getWhatsAppNotifications();
    send(res, 200, r);
  },
  'POST /webhooks': async (req, res) => {
    const body = await readBody(req);
    if (!body.url) return send(res, 400, { error: 'url required' });
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO webhooks (id, url, secret, active, created_at) VALUES (?,?,?,?,?)')
      .run(id, body.url, body.secret || null, 1, now());
    send(res, 201, { id, url: body.url });
  },
};

const server = http.createServer(async (req, res) => {
  if (!auth(req)) return send(res, 401, { error: 'unauthorized' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;
  // match route
  for (const key of Object.keys(routes)) {
    const [m, p] = key.split(' ');
    if (m !== method) continue;
    // build regex
    const paramNames = [];
    const regexStr = p.replace(/:([^/]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; });
    const re = new RegExp('^' + regexStr + '$');
    const match = path.match(re);
    if (match) {
      const params = {};
      paramNames.forEach((n, i) => (params[n] = decodeURIComponent(match[i + 1])));
      try { await routes[key](req, res, params); }
      catch (e) { send(res, 500, { error: e.message }); }
      return;
    }
  }
  send(res, 404, { error: 'not found' });
});

server.listen(config.port, config.host, () => {
  console.log(`[api] listening on http://${config.host}:${config.port}`);
});
module.exports = server;
