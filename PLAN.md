# Plano de ImplementaÃ§Ã£o â€” API Aprove Ã— WhatsApp (BlueStacks)

## RecomendaÃ§Ã£o de arquitetura (leve e Ã¡gil)

**NÃ£o execute o BlueStacks na VPS.** O BlueStacks 5 Ã© uma aplicaÃ§Ã£o Windows de desktop que requer:
- Windows (host ou VM) com Hyper-V/VirtualBox habilitado.
- GPU/driver compatÃ­vel e RAM dedicada (mÃ­nimo ~4 GB para a instÃ¢ncia).
- Licenciamento/ToS que nÃ£o cobre servidores headless.

Uma VPS Linux tÃ­pica nÃ£o roda BlueStacks. O emulador do Android SDK tambÃ©m exige KVM e Ã© pesado para VPS.

### OpÃ§Ã£o recomendada (mais leve e Ã¡gil): separaÃ§Ã£o host Windows Ã— VPS

| Componente | Onde roda | Motivo |
|---|---|---|
| BlueStacks + WhatsApp (instÃ¢ncia de teste) | Host Windows atual (ou Windows VPS pequeno) | Requisito do emulador |
| Worker de automaÃ§Ã£o (ADB + UIAutomation) | Mesmo host Windows | Acesso local ao ADB; sem expor ADB |
| API central, fila, banco, webhooks | VPS (Linux) | Acesso pÃºblico, TLS, backups |
| Painel de saÃºde/intervenÃ§Ã£o | VPS (web) | OperaÃ§Ã£o remota |

ComunicaÃ§Ã£o: o worker abre uma **conexÃ£o de saÃ­da autenticada** (WebSocket ou polling HTTPS com mTLS/API key) para a VPS. ADB nunca Ã© exposto Ã  internet. Isso Ã© exatamente a separaÃ§Ã£o proposta no escopo e a mais barata de operar.

### Alternativas (mais pesadas)

- **Windows VPS com BlueStacks:** funciona, mas custo alto, licenciamento duvidoso, latÃªncia de UI.
- **Emulador Android SDK na VPS (KVM):** requer VPS com nested virtualization, RAM â‰¥ 8 GB, manutenÃ§Ã£o de imagem Android.
- **Dispositivo fÃ­sico Android + host:** mais estÃ¡vel para WhatsApp, mas exige hardware dedicado e ADB over Wi-Fi.

## Fases

1. **InventÃ¡rio & acesso** (feito) â€” confirmar BlueStacks ausente, ADB disponÃ­vel, SDK instalado.
2. **ReinstalaÃ§Ã£o do alvo** â€” reinstalar BlueStacks 5.22 (mesma ediÃ§Ã£o) OU decidir por emulador SDK/dispositivo. Instalar WhatsApp/WhatsApp Business de teste. Criar instÃ¢ncia isolada.
3. **InvestigaÃ§Ã£o Aâ€“E** (engenharia reversa local) â€” ADB, UI tree, seletores, envio/recebimento, mÃ­dia, concorrÃªncia. Registrar evidÃªncias.
4. **Prova de conceito** â€” conexÃ£o, identificaÃ§Ã£o de app/tela, envio de texto, captura de resposta, webhook, reconexÃ£o, mÃ­dia.
5. **MVP** â€” API + fila persistente + worker + adaptador Android + banco + webhooks + painel.
6. **ValidaÃ§Ã£o** â€” reinÃ­cio, queda de rede, duplicaÃ§Ã£o, interferÃªncia manual, pop-ups, arquivo invÃ¡lido, webhook indisponÃ­vel, envio incerto.
7. **IntegraÃ§Ã£o Aprove** â€” apÃ³s MVP estÃ¡vel.

## Matriz de recursos (provisÃ³ria â€” a confirmar)

| Recurso | Status atual |
|---|---|
| ConexÃ£o ADB Ã  instÃ¢ncia | IndisponÃ­vel (sem emulador) |
| IdentificaÃ§Ã£o de app/tela | NÃ£o testado |
| Envio de texto | NÃ£o testado |
| Recebimento via notificaÃ§Ãµes | NÃ£o testado |
| Recebimento via UI | NÃ£o testado |
| Imagens/documentos (envio) | NÃ£o testado |
| MÃ­dias recebidas | NÃ£o testado |
| ReconexÃ£o/recuperaÃ§Ã£o | NÃ£o testado |

## Acessos faltantes (sem senhas/cÃ³digos no chat)

1. DecisÃ£o e permissÃ£o para reinstalar BlueStacks (admin) â€” ou escolha de alternativa.
2. APK do WhatsApp ou WhatsApp Business (versÃ£o exata) para a instÃ¢ncia de teste.
3. NÃºmero de telefone dedicado para testes + conta + contatos autorizados.
4. Detalhes da VPS: SO, IP pÃºblico, portas liberadas, domÃ­nio, certificado TLS.
5. Webhook de teste (URL) para validar recebimento.
6. Credenciais da API Aprove (fase posterior).
7. (Opcional) Acesso SSH Ã  VPS para deploy.

## PrÃ³ximo passo recomendado

Responder com: (a) opÃ§Ã£o de emulador escolhida, (b) caminho/versÃ£o do APK de teste, (c) dados da VPS (sem senhas), (d) se deseja que eu comece o esqueleto do MVP com mocks em paralelo.

Nenhuma mensagem enviada a clientes reais. Nenhuma alteraÃ§Ã£o de produÃ§Ã£o.
## Status atual (2026-11-04)

### Implementado
- BlueStacks 5.22.288.1014 reinstalado, ADB habilitado, instância 1280->960x540 @160dpi, 2 CPU, 2 GB RAM.
- Android 9 (API 28), GMS + Play Store, internet OK.
- WhatsApp comum instalado (com.whatsapp), pendente registro (usuário fará manualmente).
- UI de registro mapeada com seletores semânticos (registration_country, registration_cc, registration_phone, registration_submit/button_view).
- uiautomator dump funcional.
- MVP em Node 24 (sem dependências externas): API HTTP + SQLite (node:sqlite) + fila persistente + worker + adaptador ADB + webhook assinado + endpoint experimental de notificações.
- OpenAPI 3.0 + README + .env.example.

### Arquivos
- C:\Users\evert\aprove-wa\INVENTORY.md
- C:\Users\evert\aprove-wa\PLAN.md
- C:\Users\evert\aprove-wa\mvp\ (código completo)
- C:\Users\evert\aprove-wa\mvp\docs\openapi.yaml

### Pendente (depende do registro do WhatsApp)
- Mapear UI principal (lista de chats, conversa, campo de mensagem, botão enviar, anexos).
- Validar envio de texto (estado "entregue/lida" requer observação real).
- Recebimento via notificações (experimental) e via UI.
- Imagem/PDF (envio e recebimento).
- Testes de recuperação/interferência manual.

### Como rodar
```
cd C:\Users\evert\aprove-wa\mvp
copy .env.example .env   # ajustar API_KEY
node src/server.js       # terminal 1
node src/worker.js       # terminal 2
node scripts/smoke-test.js
```
## Tentativa de envio via ADB (2026-11-04)

Testados sem sucesso (coordenadas não acionam botões neste BlueStacks):
- input tap / touchscreen tap / mouse tap / touchpad tap (várias transformações de coordenadas)
- input keyevent (ENTER 66, DPAD_CENTER 23, TAB 61)
- cmd input (indisponível no Android 9)
- su (não disponível)

Comprovado:
- Deep link `whatsapp://send?phone=...&text=...` abre a conversa com texto pré-preenchido.
- Tela de conversa mapeada (entry, send, attach, emoji, back, message_text, etc.).

Conclusão: envio automatizado por toque não é viável neste BlueStacks via ADB.
Alternativas: (a) Android Studio Emulator (input tap funciona), (b) clicker uiautomator (requer compilação), (c) WhatsApp Web/Desktop.

Status final de recursos:
| Recurso | Status |
|---|---|
| Conexão ADB | Comprovado |
| UI tree | Comprovado |
| Abrir conversa (deep link) | Comprovado |
| Pré-preencher texto | Comprovado |
| Envio por toque | Indisponível (BlueStacks) |
| Recebimento via notificações | Parcial (experimental) |
| Recebimento via UI | Parcial (seletores mapeados) |
| Imagens/documentos | Não testado |
## Fluxos mapeados

### A. Registro de número (adicionar número) — mapeado
1. Tela `register_phone_layout`: país (`registration_country`), código (`registration_cc`), número (`registration_phone`), botão (`registration_submit`/`button_view` "AVANÇAR").
2. Após enviar, WhatsApp envia código SMS (fora do escopo de automação — usuário informa manualmente ou via SMS gateway).
3. Tela de código SMS (a mapear com número real).
4. Tela de perfil (nome/foto) (a mapear).
5. Tela principal (lista de conversas) — mapeada.

### B. Vinculação de dispositivo (QR code / Linked Devices) — não testado
- Caminho: Configurações ? Aparelhos conectados ? Conectar um aparelho ? exibe QR code.
- Requer toque em menuitem_overflow (coordenadas não confiáveis neste emulador).
- O QR code é exibido na tela; para automação, seria necessário capturar a tela (screencap) e decodificar o QR (ex.: zbar/pyzbar).
- Uso: vincular o emulador como dispositivo secundário a uma conta existente, sem SMS.
- Limitação: o dispositivo principal precisa escanear o QR; não é "adicionar número", é "vincular dispositivo".

### C. Envio de mensagem (parcial)
- Abrir conversa: deep link `whatsapp://send?phone=...&text=...` (comprovado).
- Pré-preenchimento de texto: comprovado.
- Toque no botão enviar: INDISPONÍVEL neste BlueStacks (input tap não funciona).
- Workaround: ENTER não envia; DPAD_CENTER não envia.

### D. Recebimento (parcial)
- Notificações: endpoint experimental `/instances/{id}/notifications` (dumpsys notification + parse heurístico).
- UI scraping: seletores mapeados, polling necessário.
- Diferenciação de mensagens novas vs processadas: requer persistência de IDs/last_seen (a implementar).

### E. Mídia (não testado)
- Transferência de arquivos: `adb push` para /sdcard (comprovado funcional).
- Seleção de anexo: `input_attach_button` (seletor mapeado).
- Validação de tipo/tamanho/integridade: a implementar.
