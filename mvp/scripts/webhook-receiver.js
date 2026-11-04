// scripts/webhook-receiver.js — servidor de teste para validar webhooks
const http = require('node:http');
const crypto = require('node:crypto');
const PORT = process.env.PORT || 4000;
const SECRET = process.env.WEBHOOK_SECRET || 'change-me-webhook';

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const sig = req.headers['x-signature'];
    const ok = sig === crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} sig_ok=${ok}`);
    console.log(body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
  });
}).listen(PORT, () => console.log(`webhook receiver on http://127.0.0.1:${PORT}`));
