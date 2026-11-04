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
