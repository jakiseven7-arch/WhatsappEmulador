// src/adapter/adb.js
const { execFileSync } = require('node:child_process');
const config = require('../config');

function run(args, opts = {}) {
  const timeout = opts.timeout || 30000;
  try {
    const out = execFileSync(config.adbPath, ['-s', config.adbSerial, ...args], {
      timeout,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: (out || '').trim(), stderr: '' };
  } catch (e) {
    return { ok: false, stdout: (e.stdout || '').toString().trim(), stderr: (e.stderr || e.message || '').toString().trim(), code: e.status };
  }
}

function shell(cmd) {
  return run(['shell', cmd]);
}

function isDeviceOnline() {
  const r = run(['get-state']);
  return r.ok && r.stdout === 'device';
}

function getProp(name) {
  const r = shell(`getprop ${name}`);
  return r.ok ? r.stdout : null;
}

function uiDump(remotePath = '/sdcard/ui.xml') {
  const r = shell(`uiautomator dump ${remotePath}`);
  if (!r.ok) return r;
  const pull = run(['pull', remotePath, '-'], { timeout: 30000 });
  // adb pull to stdout not supported on all; fallback to file pull
  return r;
}

function pullFile(remote, local) {
  return run(['pull', remote, local]);
}

function pushFile(local, remote) {
  return run(['push', local, remote]);
}

function tap(x, y) {
  return shell(`input tap ${x} ${y}`);
}

function inputText(text) {
  // adb input text doesn't handle spaces/accents well; use base64 via am broadcast or input keyevent.
  // For MVP, replace spaces with %s and basic latin. Emojis/accents need alternative (clipboard).
  const safe = text.replace(/ /g, '%s');
  return shell(`input text "${safe}"`);
}

function keyEvent(code) {
  return shell(`input keyevent ${code}`);
}

function screenshot(remotePath = '/sdcard/screen.png') {
  const r = shell(`screencap -p ${remotePath}`);
  if (!r.ok) return r;
  return pullFile(remotePath, remotePath.replace('/sdcard/', ''));
}

module.exports = { run, shell, isDeviceOnline, getProp, uiDump, pullFile, pushFile, tap, inputText, keyEvent, screenshot };
