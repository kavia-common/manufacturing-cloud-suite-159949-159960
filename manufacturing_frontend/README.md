manufacturing_frontend (Vite + React) - Local/Dev Guide

Overview
- Responsive web UI for the Manufacturing Cloud Suite.
- Consumes REST APIs and WebSockets from manufacturing_api.

Required tools
- Node.js 20+ (18+ may work; 20+ recommended)
- npm 10+ (or pnpm/yarn if preferred)

Environment setup
- Copy .env.example to .env and set:
  - VITE_API_BASE_URL (e.g., http://localhost:8000)
  - VITE_WS_BASE_URL (e.g., ws://localhost:8000) or omit to auto-derive from location
- Install dependencies:
  npm ci

Startup order
1) Start manufacturing_db (PostgreSQL)
2) Start manufacturing_api (FastAPI) and verify http://localhost:8000/health
3) Start this frontend

Start the dev server
- Vite dev mode:
  npm run dev
- The dev server runs on http://localhost:3000 (strict port). It proxies /api and /ws to VITE_API_BASE_URL.

Key environment variables
- VITE_API_BASE_URL: Base HTTP URL for API (http://localhost:8000 by default).
- VITE_WS_BASE_URL: Base WS URL for WebSockets (ws://localhost:8000). If omitted, client derives it from current location.

WebSockets
- Client connects to:
  - /ws/dashboard
  - /ws/scheduler?board=<id>
- It sends ?token=<JWT> as a query param automatically.
- Note: The backend expects an X-Tenant-ID header for WS. Browsers cannot set custom headers for WS handshakes. Consider adapting the backend to also accept a `tenant` query param for local dev; otherwise use server-side WS clients.

Sample Docker Compose (reference)
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: dbuser123
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

  api:
    image: python:3.11-slim
    working_dir: /api
    volumes:
      - ../manufacturing-cloud-suite-159949-159959/manufacturing_api:/api
    environment:
      POSTGRES_URL: postgresql://appuser:dbuser123@db:5432/myapp
      CORS_ORIGINS: http://localhost:3000
      JWT_SECRET_KEY: dev-change-me
      RUN_MIGRATIONS_ON_STARTUP: "true"
    depends_on:
      - db
    command: sh -c "pip install -r requirements.txt && uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload"
    ports:
      - "8000:8000"

  web:
    image: node:20-alpine
    working_dir: /web
    volumes:
      - ./:/web
    environment:
      VITE_API_BASE_URL: http://localhost:8000
      VITE_WS_BASE_URL: ws://localhost:8000
    depends_on:
      - api
    command: sh -c "npm ci && npm run dev -- --host --port 3000"
    ports:
      - "3000:3000"

volumes:
  db_data:

Troubleshooting
- 404 or 500 from API calls:
  - Ensure API is running and VITE_API_BASE_URL is set correctly.
- CORS errors:
  - Ensure backend CORS_ORIGINS includes http://localhost:3000 (or your origin).
- 401 Unauthorized:
  - Ensure login flow obtains a valid JWT and subsequent calls include Authorization: Bearer <token> and X-Tenant-ID.
- WebSocket connection fails:
  - Backend currently requires X-Tenant-ID header; browsers cannot set this on WS handshake. Consider adding a tenant query param in backend for browser testing.
- Port already in use:
  - Change dev server port: npm run dev -- --port 3001 and update any hardcoded links if needed.
