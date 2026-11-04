// scripts/smoke-test.js
const base = process.env.BASE || 'http://127.0.0.1:3100';
const key = process.env.API_KEY || 'dev-key-123';
async function req(method, path, body) {
  const r = await fetch(base + path, { method, headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json() };
}
(async () => {
  console.log('health:', await req('GET', '/health'));
  console.log('instances:', await req('GET', '/instances'));
  console.log('status:', await req('GET', '/instances/bs-local-1/status'));
  console.log('notifications:', await req('GET', '/instances/bs-local-1/notifications'));
  console.log('OK');
})();
