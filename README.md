# Bathroom Codes

A map-based app for finding bathroom door codes at nearby businesses.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your `DATABASE_URL`. For local development using Docker (see next step), use:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bathroom_codes
```

### 3. Start the local database

```bash
docker compose up -d
```

This starts a Postgres 17 container on port 5432.

### 4. Set up the database

Run migrations and seed data (see [Database](#database) below).

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database

These commands work in any environment. They read `DATABASE_URL` from `.env.local`.

| Command | Description |
|---|---|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Truncate and re-seed the `locations` table |
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:studio` | Open Drizzle Studio to browse the database |

For a fresh setup, run migrate then seed:

```bash
npm run db:migrate
npm run db:seed
```

There is some possibility you may need to load the environment variable explicitly when running these:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bathroom_codes" npm run db:migrate
```

---

## Deployment

The app deploys automatically to Vercel on every push to `main`:

```bash
git push origin main
```

Make sure the `DATABASE_URL` environment variable is set in the Vercel project settings, pointing to your production Postgres database.
