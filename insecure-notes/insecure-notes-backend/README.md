# Insecure Notes backend

Same API shape as the secure app, without the security controls. Listens on port 3001 and uses the `insecure_notes` PostgreSQL database (created on first start if it does not exist).

Dummy logins: `user` / `password` and `admin` / `password`.

## Setup

1. Start PostgreSQL from `secure-notes-database` (same server; this app uses a different database name):

```bash
cd ../secure-notes-database
docker compose up -d
```

2. Start the API:

```bash
cd ../insecure-notes-backend
copy .env.example .env
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

## Test APIs

Health:

```http
GET http://localhost:3001/api/health
```

Login:

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}
```
