# Insecure Notes database

PostgreSQL for the **insecure** app, published on host port **5433** so it can run next to the secure database on **5432**.

Tables are created from `sql/` the first time the container starts with an empty volume.

```bash
cd insecure-notes/secure-notes-database
docker compose up -d
```

Edit the SQL files to change the schema, then recreate the volume:

```bash
docker compose down -v
docker compose up -d
```

## Do not run two insecure databases at once

`insecure-notes/docker-compose.yml` (the full insecure app stack) already publishes Postgres on host port **5433** as container `insecure-notes-db`.

Run **either**:

- this database-only compose (`insecure-notes-database` / container `insecure-notes-database`), **or**
- the full `insecure-notes` stack

not both. pgAdmin settings stay the same either way: `localhost:5433` / `insecure_notes`.

## pgAdmin — both databases at once

You can register both servers in pgAdmin while the **secure** Postgres (port 5432) and **one** insecure Postgres (port 5433) are running.

### Secure Notes

| Setting  | Value          |
|----------|----------------|
| Host     | `localhost`    |
| Port     | `5432`         |
| Database | `secure_notes` |
| User     | `postgres`     |
| Password | `postgres`     |

If you started Postgres from `secure-notes/docker-compose.yml`, that instance may require SSL. In pgAdmin set SSL mode to **require** (`sslmode=require`). The standalone `secure-notes-database` compose typically does not enable SSL.

### Insecure Notes

| Setting  | Value            |
|----------|------------------|
| Host     | `localhost`      |
| Port     | `5433`           |
| Database | `insecure_notes` |
| User     | `postgres`       |
| Password | `postgres`       |

The insecure Docker Postgres typically has **no SSL**. Leave SSL mode as **disable** / Prefer, or `sslmode=disable`.
