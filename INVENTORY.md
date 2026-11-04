# RelatÃ³rio de InventÃ¡rio â€” API Aprove Ã— WhatsApp (BlueStacks)

Data: 2026-11-04
Host: EVERTON (HP 256R 15.6", Windows 11 Home Single Language, build 26200)

## 1. Host

- SO: Microsoft Windows 11 Home Single Language (10.0.26200)
- CPU: Intel Core i5-1334U (10 cores / 12 threads, ~1.3 GHz)
- RAM: 16 GB total; ~1.9 GB disponÃ­vel no momento (memÃ³ria sob pressÃ£o)
- Disco C: ~39 GB livres de ~255 GB
- Rede: Wi-Fi (192.168.1.100); Ethernet desconectada
- VirtualizaÃ§Ã£o baseada em hypervisor: em execuÃ§Ã£o (Hyper-V detectado) â€” relevante para emulador

## 2. BlueStacks

- **Status: NÃƒO INSTALADO.** O desinstalador rodou em 2026-04-07 e removeu `C:\Program Files\BlueStacks_nxt\` e `C:\ProgramData\BlueStacks_nxt`.
- VersÃ£o anteriormente instalada: 5.22.164.1002 (ediÃ§Ã£o "nxt"/Pie64).
- Restos: logs em `C:\Users\evert\AppData\Local\BlueStacks\` e instalador do "bluestacks-services-updater" em `C:\Users\evert\AppData\Local\bluestacks-services-updater\installer.exe` (84 MB).
- Nenhum processo BlueStacks/Android em execuÃ§Ã£o.
- **Bloqueador crÃ­tico:** sem instÃ¢ncia de emulador nÃ£o hÃ¡ alvo para ADB/UIAutomation.

## 3. ADB / Android SDK

- Android SDK presente em `C:\Users\evert\AppData\Local\Android\Sdk`.
- `adb.exe` (v1.0.41, platform-tools 36.0.2) funcional, mas **nÃ£o estÃ¡ no PATH**.
- `adb devices` retorna lista vazia (nenhum dispositivo/emulador conectado).
- Android Studio 2025.2.3 instalado (caches em AppData).
- Plataformas: android-36; system-images android-36.1; emulador do SDK presente.

## 4. Ferramentas de desenvolvimento

- Node.js v24.22.1 (via nvm) â€” disponÃ­vel.
- Python 3.14.3 â€” disponÃ­vel.
- Git 2.51.2 â€” disponÃ­vel.
- REA MCP server â€” disponÃ­vel (ferramentas de anÃ¡lise estÃ¡tica de binÃ¡rios/APKs/JS).
- Nenhum APK do WhatsApp ou WhatsApp Business localizado em Downloads/Documents/Desktop.

## 5. Lacunas / acessos faltantes (sem solicitar senhas)

1. BlueStacks precisa ser reinstalado (ou decidir usar o emulador do Android SDK / dispositivo fÃ­sico).
2. APK do WhatsApp ou WhatsApp Business (versÃ£o exata) para instalar na instÃ¢ncia de teste.
3. NÃºmero de telefone dedicado para testes + conta autorizada + contatos de teste (participantes autorizados).
4. InstÃ¢ncia separada para testes (nÃ£o usar produÃ§Ã£o).
5. Detalhes da VPS (SO, IP, portas, domÃ­nio, certificado) e como o host Windows se comunicarÃ¡ com ela.
6. Webhook de teste (URL) para validar recebimento.
7. Credenciais de API da plataforma Aprove (quando chegar a integraÃ§Ã£o).
8. PermissÃ£o para instalar/reinstalar BlueStacks (admin).

## 6. ObservaÃ§Ãµes de seguranÃ§a/limitaÃ§Ã£o

- Sem BlueStacks rodando, nenhuma etapa de prova de conceito (envio/recebimento) pode ser executada agora.
- Engenharia reversa via REA sÃ³ Ã© aplicÃ¡vel a artefatos locais (APK, binÃ¡rios). Nenhum artefato do WhatsApp/BlueStacks estÃ¡ disponÃ­vel localmente no momento.
- A automaÃ§Ã£o proposta depende de UIAutomation/ADB; nÃ£o envolve extraÃ§Ã£o de chaves/credenciais do WhatsApp.

## 7. PrÃ³ximos passos sugeridos

- Decidir: reinstalar BlueStacks 5.x ou usar emulador do Android SDK.
- Obter APK de teste do WhatsApp/WhatsApp Business.
- Criar instÃ¢ncia de teste isolada.
- ApÃ³s isso, executar investigaÃ§Ã£o Aâ€“E e PoC.
- Paralelamente, posso comeÃ§ar o esqueleto do MVP (API + fila + worker) com mocks, sem tocar em produÃ§Ã£o.

Nenhuma mensagem foi enviada a clientes reais. Nenhuma alteraÃ§Ã£o de produÃ§Ã£o realizada.
## BlueStacks (reinstalado nesta sessão)

- Versão: 5.22.288.1014 (Pie64).
- ADB habilitado via bluestacks.conf (bst.enable_adb_access=1, bst.enable_adb_remote_access=1).
- Instância: 127.0.0.1:5555 (emulator-5554), Android 9 (API 28), modelo SM-G998B (spoof).
- Tela: 1280x720, densidade 240.
- Internet: OK.
- GMS e Play Store presentes -> push (FCM) disponível.
- WhatsApp: NÃO instalado. Play Store disponível para instalação manual, ou sideload via adb install <apk>.
- ADB via SDK (v41) conecta e shell funciona após habilitar acesso.

## Matriz de recursos (atualizada)

| Recurso | Status |
|---|---|
| Conexão ADB à instância | Comprovado |
| Identificação de app/tela | Próximo passo (uiautomator dump) |
| Envio de texto | Não testado |
| Recebimento via notificações | Não testado (GMS presente) |
| Recebimento via UI | Não testado |
| Imagens/documentos (envio) | Não testado |
| Mídias recebidas | Não testado |
| Reconexão/recuperação | Não testado |
## UI do WhatsApp mapeada (conversa)

Seletores semânticos confirmados (com.whatsapp:id):
- entry (EditText, focado) — campo de mensagem
- send (ImageButton, content-desc "Enviar") — botão enviar
- input_attach_button (ImageButton, "Anexar") — anexar
- emoji_picker_btn (ImageButton, "Emojis, GIFs e figurinhas")
- back (LinearLayout) / whatsapp_toolbar_home (Button "Voltar")
- conversation_contact_name (TextView) — nome do contato
- message_text (TextView) — texto da mensagem
- conversation_row_date_divider, info (criptografia)
- newChatFab (fab, "Nova conversa") — tela principal
- conversationRow (contact_row_container), conversationRowName, lastMessagePreview

## Limitação descoberta: envio por toque
- ADB `input tap` (touchscreen/mouse/touchpad) NÃO aciona botões neste BlueStacks (sistema de coordenadas não mapeia para o viewport do app).
- `input keyevent` (ENTER/DPAD_CENTER/TAB) não envia.
- `cmd input` indisponível (Android 9).
- Deep link `whatsapp://send?phone=...&text=...` abre a conversa com texto pré-preenchido de forma confiável.
- **Recomendação:** (a) calibrar toque via uiautomator test jar, ou (b) usar Android Studio Emulator (já instalado) onde `input tap` funciona com coordenadas físicas, ou (c) usar WhatsApp Web/Desktop.

## Status de recursos (final desta investigação)
| Recurso | Status |
|---|---|
| Conexão ADB | Comprovado |
| UI tree (uiautomator) | Comprovado |
| Abrir conversa via deep link | Comprovado |
| Pré-preencher texto | Comprovado |
| Envio por toque | Indisponível neste emulador |
| Recebimento via notificações | Parcial (endpoint experimental, não testado em produção) |
| Recebimento via UI | Parcial (seletores mapeados, polling necessário) |
| Imagens/documentos | Não testado |
