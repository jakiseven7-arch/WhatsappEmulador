# Plano de Implementação — API Aprove × WhatsApp (BlueStacks)

## Recomendação de arquitetura (leve e ágil)

**Não execute o BlueStacks na VPS.** O BlueStacks 5 é uma aplicação Windows de desktop que requer:
- Windows (host ou VM) com Hyper-V/VirtualBox habilitado.
- GPU/driver compatível e RAM dedicada (mínimo ~4 GB para a instância).
- Licenciamento/ToS que não cobre servidores headless.

Uma VPS Linux típica não roda BlueStacks. O emulador do Android SDK também exige KVM e é pesado para VPS.

### Opção recomendada (mais leve e ágil): separação host Windows × VPS

| Componente | Onde roda | Motivo |
|---|---|---|
| BlueStacks + WhatsApp (instância de teste) | Host Windows atual (ou Windows VPS pequeno) | Requisito do emulador |
| Worker de automação (ADB + UIAutomation) | Mesmo host Windows | Acesso local ao ADB; sem expor ADB |
| API central, fila, banco, webhooks | VPS (Linux) | Acesso público, TLS, backups |
| Painel de saúde/intervenção | VPS (web) | Operação remota |

Comunicação: o worker abre uma **conexão de saída autenticada** (WebSocket ou polling HTTPS com mTLS/API key) para a VPS. ADB nunca é exposto à internet. Isso é exatamente a separação proposta no escopo e a mais barata de operar.

### Alternativas (mais pesadas)

- **Windows VPS com BlueStacks:** funciona, mas custo alto, licenciamento duvidoso, latência de UI.
- **Emulador Android SDK na VPS (KVM):** requer VPS com nested virtualization, RAM ≥ 8 GB, manutenção de imagem Android.
- **Dispositivo físico Android + host:** mais estável para WhatsApp, mas exige hardware dedicado e ADB over Wi-Fi.

## Fases

1. **Inventário & acesso** (feito) — confirmar BlueStacks ausente, ADB disponível, SDK instalado.
2. **Reinstalação do alvo** — reinstalar BlueStacks 5.22 (mesma edição) OU decidir por emulador SDK/dispositivo. Instalar WhatsApp/WhatsApp Business de teste. Criar instância isolada.
3. **Investigação A–E** (engenharia reversa local) — ADB, UI tree, seletores, envio/recebimento, mídia, concorrência. Registrar evidências.
4. **Prova de conceito** — conexão, identificação de app/tela, envio de texto, captura de resposta, webhook, reconexão, mídia.
5. **MVP** — API + fila persistente + worker + adaptador Android + banco + webhooks + painel.
6. **Validação** — reinício, queda de rede, duplicação, interferência manual, pop-ups, arquivo inválido, webhook indisponível, envio incerto.
7. **Integração Aprove** — após MVP estável.

## Matriz de recursos (provisória — a confirmar)

| Recurso | Status atual |
|---|---|
| Conexão ADB à instância | Indisponível (sem emulador) |
| Identificação de app/tela | Não testado |
| Envio de texto | Não testado |
| Recebimento via notificações | Não testado |
| Recebimento via UI | Não testado |
| Imagens/documentos (envio) | Não testado |
| Mídias recebidas | Não testado |
| Reconexão/recuperação | Não testado |

## Acessos faltantes (sem senhas/códigos no chat)

1. Decisão e permissão para reinstalar BlueStacks (admin) — ou escolha de alternativa.
2. APK do WhatsApp ou WhatsApp Business (versão exata) para a instância de teste.
3. Número de telefone dedicado para testes + conta + contatos autorizados.
4. Detalhes da VPS: SO, IP público, portas liberadas, domínio, certificado TLS.
5. Webhook de teste (URL) para validar recebimento.
6. Credenciais da API Aprove (fase posterior).
7. (Opcional) Acesso SSH à VPS para deploy.

## Próximo passo recomendado

Responder com: (a) opção de emulador escolhida, (b) caminho/versão do APK de teste, (c) dados da VPS (sem senhas), (d) se deseja que eu comece o esqueleto do MVP com mocks em paralelo.

Nenhuma mensagem enviada a clientes reais. Nenhuma alteração de produção.
## Status atual (2026-11-04)

### Implementado
- BlueStacks 5.22.288.1014 reinstalado, ADB habilitado, inst�ncia 1280->960x540 @160dpi, 2 CPU, 2 GB RAM.
- Android 9 (API 28), GMS + Play Store, internet OK.
- WhatsApp comum instalado (com.whatsapp), pendente registro (usu�rio far� manualmente).
- UI de registro mapeada com seletores sem�nticos (registration_country, registration_cc, registration_phone, registration_submit/button_view).
- uiautomator dump funcional.
- MVP em Node 24 (sem depend�ncias externas): API HTTP + SQLite (node:sqlite) + fila persistente + worker + adaptador ADB + webhook assinado + endpoint experimental de notifica��es.
- OpenAPI 3.0 + README + .env.example.

### Arquivos
- C:\Users\evert\aprove-wa\INVENTORY.md
- C:\Users\evert\aprove-wa\PLAN.md
- C:\Users\evert\aprove-wa\mvp\ (c�digo completo)
- C:\Users\evert\aprove-wa\mvp\docs\openapi.yaml

### Pendente (depende do registro do WhatsApp)
- Mapear UI principal (lista de chats, conversa, campo de mensagem, bot�o enviar, anexos).
- Validar envio de texto (estado "entregue/lida" requer observa��o real).
- Recebimento via notifica��es (experimental) e via UI.
- Imagem/PDF (envio e recebimento).
- Testes de recupera��o/interfer�ncia manual.

### Como rodar
```
cd C:\Users\evert\aprove-wa\mvp
copy .env.example .env   # ajustar API_KEY
node src/server.js       # terminal 1
node src/worker.js       # terminal 2
node scripts/smoke-test.js
```
## Tentativa de envio via ADB (2026-11-04)

Testados sem sucesso (coordenadas n�o acionam bot�es neste BlueStacks):
- input tap / touchscreen tap / mouse tap / touchpad tap (v�rias transforma��es de coordenadas)
- input keyevent (ENTER 66, DPAD_CENTER 23, TAB 61)
- cmd input (indispon�vel no Android 9)
- su (n�o dispon�vel)

Comprovado:
- Deep link `whatsapp://send?phone=...&text=...` abre a conversa com texto pr�-preenchido.
- Tela de conversa mapeada (entry, send, attach, emoji, back, message_text, etc.).

Conclus�o: envio automatizado por toque n�o � vi�vel neste BlueStacks via ADB.
Alternativas: (a) Android Studio Emulator (input tap funciona), (b) clicker uiautomator (requer compila��o), (c) WhatsApp Web/Desktop.

Status final de recursos:
| Recurso | Status |
|---|---|
| Conex�o ADB | Comprovado |
| UI tree | Comprovado |
| Abrir conversa (deep link) | Comprovado |
| Pr�-preencher texto | Comprovado |
| Envio por toque | Indispon�vel (BlueStacks) |
| Recebimento via notifica��es | Parcial (experimental) |
| Recebimento via UI | Parcial (seletores mapeados) |
| Imagens/documentos | N�o testado |
