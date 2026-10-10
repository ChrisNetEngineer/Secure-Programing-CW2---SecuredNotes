# Insecure Notes

Hosted with Docker Compose: frontend, API, and PostgreSQL (3 containers).

```bash
cd insecure-notes
docker compose up --build
```

- UI: http://localhost:5174
- API: http://localhost:3001
- Database: localhost:5433 (`insecure_notes`)

Dummy logins: `user` / `password` and `admin` / `password`.

This stack does not use `secure-notes-database`. That compose keeps port 5432 and the `secure_notes` database. This one uses port 5433 and `insecure_notes`, so both can run at the same time.
