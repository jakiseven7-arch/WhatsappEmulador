# Aprove WA MVP

API local para integra√ß√£o Aprove <-> WhatsApp executado no BlueStacks via ADB.

## Requisitos
- Node.js >= 24 (usa node:sqlite nativo)
- BlueStacks 5 com ADB habilitado (bst.enable_adb_access=1)
- WhatsApp instalado e registrado em inst√¢ncia de teste

## Instala√ß√£o
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

## Seguran√ßa
- Segredos em .env (n√£o commitar).
- ADB restrito ao ambiente local (n√£o expor √† internet).
- Webhooks assinados com HMAC-SHA256 (header X-Signature).
- Logs n√£o incluem corpo completo de conversas por padr√£o.

## Limita√ß√µes conhecidas (MVP)
- Envio usa deep link wa.me + ENTER; confirma√ß√£o observada √© "a√ß√£o executada", n√£o "entregue/lida".
- Recebimento de mensagens ainda n√£o implementado (pr√≥xima itera√ß√£o: notifica√ß√µes + UI).
- M√≠dia (imagem/PDF) experimental.
- Uma inst√¢ncia = uma a√ß√£o de UI por vez (serializa√ß√£o no worker).

## Emulador Android Studio (recomendado para envio)

O Android Studio Emulator (API 36, google_apis_playstore) suporta `input tap` com coordenadas fÌsicas,
diferente do BlueStacks. Passos:

1. Inicie o emulador:
   ```
   set ANDROID_HOME=C:\Users\evert\AppData\Local\Android\Sdk
   %ANDROID_HOME%\emulator\emulator.exe -avd Pixel_7_API_36 -no-snapshot-load -no-window
   ```
2. Aguarde o boot (~2 min). Verifique: `adb devices` deve mostrar `emulator-5554`.
3. Instale o WhatsApp via Play Store (login Google manual na UI do emulador).
4. Registre o n˙mero (SMS) manualmente.
5. Ajuste `.env`: `ADB_SERIAL=emulator-5554`.
6. Rode a API e o worker.

### Envio no emulador
Com o emulador, o worker pode usar `input tap` nas coordenadas do bot„o `send`
(bounds do uiautomator dump) para enviar a mensagem, em vez de depender do deep link + ENTER.

## Linux

O cÛdigo (Node.js) È multiplataforma. No Linux:

1. Instale o Android SDK + emulator (via Android Studio ou sdkmanager).
2. Instale o KVM: `sudo apt install qemu-kvm` (Ubuntu/Debian) e adicione seu usu·rio ao grupo `kvm`.
3. Crie um AVD com Play Store (via Android Studio GUI ou `avdmanager`).
4. Inicie o emulador: `emulator -avd <nome> -no-snapshot-load -no-window`.
5. Instale o WhatsApp via Play Store (login Google manual).
6. Ajuste `.env`:
   ```
   ADB_PATH=/usr/bin/adb  (ou /home/<user>/Android/Sdk/platform-tools/adb)
   ADB_SERIAL=emulator-5554
   ```
7. Rode a API e o worker.

### LimitaÁıes no Linux
- BlueStacks n„o roda no Linux (apenas Windows/macOS).
- O emulador do Android SDK requer KVM para performance aceit·vel.
- WhatsApp pode detectar o emulador e solicitar re-verificaÁ„o por SMS.

### Teste automatizado
O envio via `input tap` funciona no emulador Android Studio (coordenadas fÌsicas = coordenadas da UI, rotaÁ„o 0).
No BlueStacks, `input tap` n„o funciona (coordenadas n„o mapeiam).
