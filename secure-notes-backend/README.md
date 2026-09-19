# Secure Notes backend

Node.js + Express API for Secure Notes. It currently exposes a health check and a login endpoint that the frontend can call later. User data is stored in PostgreSQL.

## Setup

1. Start PostgreSQL from `secure-notes-database`:

```bash
cd ../secure-notes-database
docker compose up -d
```

The `users` table is created from `secure-notes-database/sql/001_init.sql`. Edit that file to change the schema, then run `docker compose down -v` and `docker compose up -d` to apply it.

2. Start the API:

```bash
cd ../secure-notes-backend
copy .env.example .env
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

## Test APIs

Health:

```http
GET http://localhost:3000/api/health
```

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Login succeeds only after a matching user exists in PostgreSQL.

## Frontend contract

`Login.jsx` already collects `username` and `password`. When you connect it later, send those fields to `POST /api/auth/login` as JSON. A successful response looks like:

```json
{
  "user": {
    "id": 1,
    "username": "your_username"
  }
}
```
