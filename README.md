# Feeders

Source code of [feeders.pages.dev][].

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
pnpm pages:build
pnpm preview
```

`cms:build-local` prepares local CMS data to be uploaded to external storage,
our built application fetches them instead of hitting CMS again.


Production deployment:

```bash
pnpm cms:build-local
pnpm pages:build:prod
pnpm env:push:prod
pnpm run deploy
```

The `env:push:prod` loads variables in `.env.production` and uploads them as
Pages secrets. This is to avoid exposing them in `wrangler.toml`.


## Database

Currently, local Pages dev doesn't support `--remote` D1, so we use local
sqlite db during development.

When everything is ready, run the drizzle migrations on remote D1.

- List tables, can also be used to establish local db first time

      pnpm db:tables

- Migrations with drizzle-kit (locally)

      pnpm db:migrate:gen
      pnpm db:migrate:drop
      pnpm db:migrate

- Remove local db + drizzle meta, then reset with migrations (DANGER)

      pnpm db:delete
      pnpm db:delete && pnpm db:tables && pnpm db:migrate:gen && pnpm db:migrate

- Directly execute commands on local D1

      pnpm wrangler d1 execute feeders --command 'PRAGMA table_list'
      pnpm wrangler d1 execute feeders --command 'INSERT INTO users (id, email) VALUES ("foo001", "foo@bar.com")'
      PRAGMA table_xinfo(TABLE_NAME)
      PRAGMA defer_foreign_keys = (on|off)
      SELECT name, sql FROM sqlite_master

- Run migrations on remote D1

      pnpm wrangler d1 list
      pnpm wrangler d1 migrations apply feeders --remote


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

Prepare env by copy `.env.sample` to `.env.test`.

Run `pnpm test`.


## Admin Tasks

- Inactive user

      pnpm tsx scripts/admin_activate_user.mjs {USER_ID} inactive --remote

- Drop spot, or followup

      pnpm tsx scripts/admin_drop_spot.mjs {ID} dropped --remote
      pnpm tsx scripts/admin_drop_followup.mjs {ID} dropped --remote



[feeders.pages.dev]: https://feeders.pages.dev
[feeders-charts]: https://github.com/bootleq/feeders-charts
