# AltSendme Web Server (Docker)

This folder contains a small Axum server that:

- Serves the Flutter Web build from `web-server/static/`
- Exposes a JSON/HTTP API under `/api/*` for the web UI
- Runs the Rust `sendme` core on the server side (browsers can't run `iroh`/QUIC directly)

## API (used by Flutter Web)

- `POST /api/send` (multipart field `file`) → `{ "shareId": number, "ticket": string }`
- `POST /api/send/{id}/stop` → `204`
- `POST /api/receive` (json `{ "ticket": string }`) → `{ "jobId": string }`
- `GET /api/receive/{jobId}/status` → `{ state, bytes, total, speedBps, message }` where `state` is `queued|running|done|error`
- `GET /api/receive/{jobId}/download` → downloads a zip

## Docker

Build:

`docker build -f web-server/Dockerfile -t altsendme-web:latest .`

Run:

`docker run --rm -p 8088:8080 -v $(pwd)/web-server/data:/app/data altsendme-web:latest`

Environment variables (optional):

- `BIND_ADDR` (default `0.0.0.0:8080`)
- `STATIC_DIR` (default `/app/static` inside Docker)
- `DATA_DIR` (default `/app/data` inside Docker)
- `MAX_UPLOAD_BYTES` (default `536870912` = 512 MiB)
