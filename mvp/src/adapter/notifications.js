// src/adapter/notifications.js
// Recebimento de mensagens via notificações do Android (dumpsys notification).
// LIMITAÇÃO: notificações truncam conteúdo e agrupam; não é fonte completa.
// Usado como mecanismo primário experimental; UI scraping como fallback.

const adb = require('./adb');

function dumpNotifications() {
  const r = adb.shell('dumpsys notification');
  if (!r.ok) return { ok: false, error: r.stderr };
  return { ok: true, raw: r.stdout };
}

// Extrai blocos de notificação do WhatsApp de forma heurística.
// Retorna array de { package, title, text } (melhor esforço).
function parseWhatsApp(raw) {
  const out = [];
  // Procura por "com.whatsapp" e linhas com "android.text" / "android.title"
  const lines = raw.split(/\r?\n/);
  let current = null;
  for (const ln of lines) {
    if (ln.includes('com.whatsapp')) {
      if (current) out.push(current);
      current = { package: 'com.whatsapp', title: null, text: null };
    } else if (current) {
      const t = ln.match(/android\.title=(.+)/);
      const x = ln.match(/android\.text=(.+)/);
      if (t) current.title = t[1].trim();
      if (x) current.text = x[1].trim();
    }
  }
  if (current) out.push(current);
  return out.filter((n) => n.title || n.text);
}

function getWhatsAppNotifications() {
  const d = dumpNotifications();
  if (!d.ok) return d;
  return { ok: true, notifications: parseWhatsApp(d.raw) };
}

module.exports = { dumpNotifications, parseWhatsApp, getWhatsAppNotifications };
