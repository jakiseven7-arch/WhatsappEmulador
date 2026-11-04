# Aprove WA MVP

API local para integração Aprove <-> WhatsApp executado no BlueStacks via ADB.

## Requisitos
- Node.js >= 24 (usa node:sqlite nativo)
- BlueStacks 5 com ADB habilitado (bst.enable_adb_access=1)
- WhatsApp instalado e registrado em instância de teste

## Instalação
```
cd aprove-wa/mvp
copy .env.example .env
# edite .env (API_KEY, ADB_PATH, ADB_SERIAL)
mkdir data
node src/server.js
```
Em outro terminal:
```
node src/worker.js
```

## Endpoints (autenticados via Bearer token ou X-Api-Key)
- GET /health
- GET /instances
- GET /instances/{id}/status
- POST /instances/{id}/pause
- POST /instances/{id}/resume
- POST /messages/text  { instance_id, to, body, idempotency_key?, correlation_id? }
- POST /messages/media  (501 - experimental)
- GET /messages/{id}
- POST /webhooks  { url, secret? }

## Segurança
- Segredos em .env (não commitar).
- ADB restrito ao ambiente local (não expor à internet).
- Webhooks assinados com HMAC-SHA256 (header X-Signature).
- Logs não incluem corpo completo de conversas por padrão.

## Limitações conhecidas (MVP)
- Envio usa deep link wa.me + ENTER; confirmação observada é "ação executada", não "entregue/lida".
- Recebimento de mensagens ainda não implementado (próxima iteração: notificações + UI).
- Mídia (imagem/PDF) experimental.
- Uma instância = uma ação de UI por vez (serialização no worker).

## Emulador Android Studio (recomendado para envio)

O Android Studio Emulator (API 36, google_apis_playstore) suporta `input tap` com coordenadas f�sicas,
diferente do BlueStacks. Passos:

1. Inicie o emulador:
   ```
   set ANDROID_HOME=C:\Users\evert\AppData\Local\Android\Sdk
   %ANDROID_HOME%\emulator\emulator.exe -avd Pixel_7_API_36 -no-snapshot-load -no-window
   ```
2. Aguarde o boot (~2 min). Verifique: `adb devices` deve mostrar `emulator-5554`.
3. Instale o WhatsApp via Play Store (login Google manual na UI do emulador).
4. Registre o n�mero (SMS) manualmente.
5. Ajuste `.env`: `ADB_SERIAL=emulator-5554`.
6. Rode a API e o worker.

### Envio no emulador
Com o emulador, o worker pode usar `input tap` nas coordenadas do bot�o `send`
(bounds do uiautomator dump) para enviar a mensagem, em vez de depender do deep link + ENTER.
