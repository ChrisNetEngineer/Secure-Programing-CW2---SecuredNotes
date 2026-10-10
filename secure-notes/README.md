# Secure Notes (Docker)

Frontend, API, and PostgreSQL. Every hop uses TLS.

```bash
cd secure-notes
docker compose up --build
```

Open **https://localhost:5173**. The browser certificate is issued by a local coursework CA, so accept the warning once.

| Hop | Protocol |
|---|---|
| Browser → nginx | HTTPS (TLS 1.2/1.3) |
| nginx → API | HTTPS, nginx verifies the API cert against the CA |
| API → Postgres | Postgres SSL, `hostnossl` rejected |

Dummy logins: `user` / `password` and `admin` / `password`.

Stop `secure-notes-database/docker-compose.yml` first if it is already using port 5432.

The insecure stack stays on `http://localhost:5174` and Postgres `5433`.
