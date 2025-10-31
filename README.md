# Feeders

Source code of [feeders.fyi][].

A website dedicated to ending the suffering of free-roaming / stray dogs.


## Getting Started

Initial `pnpm install`.

Prepare env file by copy `.env.sample` to `.env.development`.

Prepare database, run `pnpm db:tables && pnpm db:migrate`.

Prepare CMS, see Setup section in [directus/README.md](directus/README.md#setup).

Then run the development server:

```bash
pnpm dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


Prepare to preview:

```bash
pnpm lint
pnpm cms:build-local
pnpm worker:build
pnpm preview
```

To add a preview deployment, use `pnpm upload:preview`.

`cms:build-local` prepares local CMS data to be uploaded to external storage,
our built application fetches them instead of hitting CMS again.


Production deployment:

```bash
pnpm cms:build-local
pnpm worker:build
pnpm run deploy
```


## Database

During development, we use local D1 in .wrangler directory.

When everything is ready, run the drizzle migrations on remote D1.

- List tables, can also be used to establish local db first time

      pnpm db:tables

- Migrations with drizzle-kit (locally)

      pnpm drizzle-kit generate --name=your-migration-name
      pnpm db:migrate

- Remove local db + drizzle meta, then reset with migrations (DANGER)

      pnpm db:delete
      pnpm db:delete && pnpm db:tables && pnpm drizzle-kit generate && pnpm db:migrate

- Directly execute commands on local D1

      pnpm wrangler d1 execute feeders --command 'PRAGMA table_list'
      pnpm wrangler d1 execute feeders --command 'INSERT INTO users (id, email) VALUES ("foo001", "foo@bar.com")'
      PRAGMA table_xinfo(TABLE_NAME)
      PRAGMA defer_foreign_keys = (on|off)
      SELECT name, sql FROM sqlite_master

- Run migrations on remote D1

      pnpm wrangler d1 migrations list feeders --remote
      pnpm wrangler d1 migrations apply feeders --remote

- Export schema and data

      pnpm wrangler d1 export feeders --remote --output=./db.sql

## Authentication

- Currently testing with Google OAuth provider

- Review approved services: (you can also revoke permission here)

  https://myaccount.google.com/permissions


## Directus CMS

http://localhost:8044/admin

First time setup will create default admin user, see cms-log to get username/password.

```bash
pnpm cms
pnpm cms-log
pnpm cms-stop
pnpm cms-restart
```

See [directus/README.md](directus/README.md) for more details.


## Build with Bundle Analyzer

    ANALYZE=true pnpm build


## Charts

Content under `/charts` path is provided by a sub project [feeders-charts][].

Setup it by `pnpm pull:charts`, but currently the intermediate repo is not
public available, you have to prepare it first.


## Test

Currently we only have very limited tests, and the setup for E2E test *are missing*.

Prepare env by copy `.env.sample` to `.env.test`.

- Unit test

  Only very poor coverage, run with `pnpm test:unit`.

- E2E test

  Sorry this currently have to run on dev server, and requires local CMS and
  db setup WITH data (which doesn't available for public now).

  The command is `pnpm test:e2e`.


## Admin Tasks

- Inactive user

      pnpm tsx scripts/admin_activate_user.mjs {USER_ID} inactive --remote

- Drop spot, followup, or pick

      pnpm tsx scripts/admin_drop_spot.mjs {ID} dropped --remote
      pnpm tsx scripts/admin_drop_followup.mjs {ID} dropped --remote
      pnpm tsx scripts/admin_drop_pick.mjs {ID} dropped --remote

- Revalidate cache

      pnpm tsx --env-file=.env.development scripts/admin_revalidate_cache.mjs --path /audit --tags users


[feeders.fyi]: https://feeders.fyi
[feeders-charts]: https://github.com/bootleq/feeders-charts
