// src/adapter/whatsapp-ui.js
// Seletores descobertos via uiautomator (Android 9 / WhatsApp comum, BlueStacks 5.22).
// Coordenadas são último recurso e NÃO confiáveis neste emulador (input tap não funciona).
// Prefira deep links + uiautomator para leitura; envio requer calibração ou emulador alternativo.

const SELECTORS = {
  // Tela de registro (onboarding)
  regCountry: 'com.whatsapp:id/registration_country',
  regCountryCode: 'com.whatsapp:id/registration_cc',
  regPhone: 'com.whatsapp:id/registration_phone',
  regSubmit: 'com.whatsapp:id/registration_submit',
  regSubmitButton: 'com.whatsapp:id/button_view',

  // Tela principal (lista de conversas)
  searchBar: 'com.whatsapp:id/search_bar_inner_layout',
  searchText: 'com.whatsapp:id/search_text',
  newChatFab: 'com.whatsapp:id/fab',               // content-desc "Nova conversa"
  conversationRow: 'com.whatsapp:id/contact_row_container',
  conversationRowName: 'com.whatsapp:id/conversations_row_contact_name',
  conversationRowDate: 'com.whatsapp:id/conversations_row_date',
  lastMessagePreview: 'com.whatsapp:id/single_msg_tv',
  contactPhoto: 'com.whatsapp:id/contact_photo',

  // Tela de conversa
  backButton: 'com.whatsapp:id/back',              // content-desc "Voltar"
  contactName: 'com.whatsapp:id/conversation_contact_name',
  contactPhotoView: 'com.whatsapp:id/conversation_contact_photo',
  messageList: 'android:id/list',
  messageText: 'com.whatsapp:id/message_text',
  dateDivider: 'com.whatsapp:id/conversation_row_date_divider',
  encryptionInfo: 'com.whatsapp:id/info',

  // Entrada de mensagem
  entryField: 'com.whatsapp:id/entry',             // EditText, focado
  emojiButton: 'com.whatsapp:id/emoji_picker_btn',  // content-desc "Emojis, GIFs e figurinhas"
  attachButton: 'com.whatsapp:id/input_attach_button', // content-desc "Anexar"
  sendButton: 'com.whatsapp:id/send',               // content-desc "Enviar", ImageButton

  // Anexos (a mapear)
  // attachDocument: 'com.whatsapp:id/...',  // pendente
};

function findNodeByResourceId(xml, rid) {
  const re = new RegExp(`resource-id="${rid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*bounds="\\[([^\\]]+)\\]\\[([^\\]]+)\\]"`, 'g');
  const m = re.exec(xml);
  if (!m) return null;
  const [x1, y1] = m[1].split(',').map(Number);
  const [x2, y2] = m[2].split(',').map(Number);
  return { rid, bounds: [x1, y1, x2, y2], center: [Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)] };
}

function findNodeByText(xml, text) {
  const esc = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`text="${esc}"[^>]*bounds="\\[([^\\]]+)\\]\\[([^\\]]+)\\]"`, 'g');
  const m = re.exec(xml);
  if (!m) return null;
  const [x1, y1] = m[1].split(',').map(Number);
  const [x2, y2] = m[2].split(',').map(Number);
  return { text, bounds: [x1, y1, x2, y2], center: [Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)] };
}

module.exports = { SELECTORS, findNodeByResourceId, findNodeByText };
