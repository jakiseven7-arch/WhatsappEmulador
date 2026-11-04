// src/config.js
const path = require('node:path');
const fs = require('node:fs');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
    }
  }
}
loadEnv();

const os = require('node:os');
const isWin = os.platform() === 'win32';

function defaultAdbPath() {
  if (process.env.ADB_PATH) return process.env.ADB_PATH;
  if (isWin) return 'C:\\Users\\evert\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
  return '/usr/bin/adb'; // Linux/macOS (adjust if needed)
}
function defaultSerial() {
  return process.env.ADB_SERIAL || 'emulator-5554';
}

const config = {
  port: Number(process.env.PORT || 3100),
  host: process.env.HOST || '127.0.0.1',
  apiKey: process.env.API_KEY || 'change-me',
  adbPath: defaultAdbPath(),
  adbSerial: defaultSerial(),
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'data', 'aprove.db'),
  webhookSecret: process.env.WEBHOOK_SECRET || 'change-me-webhook',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 2000),
  maxRetries: Number(process.env.MAX_RETRIES || 3),
  logLevel: process.env.LOG_LEVEL || 'info',
  platform: os.platform(),
};

module.exports = config;
