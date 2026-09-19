# Secure Notes database

PostgreSQL runs in Docker. The `users` table is created from `sql/001_init.sql` the first time the container starts with an empty volume.

```bash
cd secure-notes-database
docker compose up -d
```

Edit `sql/001_init.sql` to change the schema, then recreate the volume:

```bash
docker compose down -v
docker compose up -d
```

Connect from the backend or pgAdmin with:

- Host: `localhost`
- Port: `5432`
- Database: `secure_notes`
- User: `postgres`
- Password: `postgres`
