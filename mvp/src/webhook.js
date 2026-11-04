// src/webhook.js
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const config = require('./config');

function sign(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function deliver(url, payload, secret) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const sig = sign(body, secret || config.webhookSecret);
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Signature': sig,
        'X-Event-Id': payload.id || '',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, error: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

module.exports = { sign, deliver };
