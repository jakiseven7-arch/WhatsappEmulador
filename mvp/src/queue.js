// src/queue.js
const { db, now } = require('./db');
const crypto = require('node:crypto');

function enqueue(instanceId, type, payload, idempotencyKey) {
  if (idempotencyKey) {
    const existing = db.prepare('SELECT id FROM commands WHERE idempotency_key = ?').get(idempotencyKey);
    if (existing) return existing.id;
  }
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO commands (id, instance_id, type, payload, idempotency_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, instanceId, type, JSON.stringify(payload), idempotencyKey || null, now(), now());
  return id;
}

function dequeue(instanceId) {
  const row = db.prepare(`SELECT * FROM commands WHERE instance_id = ? AND status = 'queued' ORDER BY created_at ASC LIMIT 1`).get(instanceId);
  if (!row) return null;
  db.prepare(`UPDATE commands SET status='running', attempts=attempts+1, updated_at=? WHERE id=?`).run(now(), row.id);
  return { ...row, payload: JSON.parse(row.payload) };
}

function markDone(id, result) {
  db.prepare(`UPDATE commands SET status='done', result=?, updated_at=? WHERE id=?`).run(JSON.stringify(result || {}), now(), id);
}

function markFailed(id, error, retry) {
  const row = db.prepare('SELECT attempts, max_attempts FROM commands WHERE id=?').get(id);
  const status = (retry && row && row.attempts < row.max_attempts) ? 'queued' : 'failed';
  db.prepare(`UPDATE commands SET status=?, error=?, updated_at=? WHERE id=?`).run(status, String(error), now(), id);
}

function getStatus(id) {
  return db.prepare('SELECT * FROM commands WHERE id=?').get(id);
}

module.exports = { enqueue, dequeue, markDone, markFailed, getStatus };
