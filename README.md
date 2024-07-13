This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3).

## Getting Started

First, run the development server:

```bash
pnpm dev

pnpm lint
pnpm preview
pnpm deploy
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Database

- List tables, can also used to establish local db first time

    pnpm db:tables

- Migrations with drizzle-kit

    pnpm db:migrate:gen
    pnpm db:migrate:drop
    pnpm db:migrate

- Remove local db + drizzle meta

    pnpm db:delete

- Directly execute commands in D1

    pnpm wrangler d1 execute feeders --command 'PRAGMA table_list'
    pnpm wrangler d1 execute feeders --command 'INSERT INTO users (id, email) VALUES ("foo001", "foo@bar.com")'
    PRAGMA table_xinfo(TABLE_NAME)
    PRAGMA defer_foreign_keys = (on|off)
    SELECT name, sql FROM sqlite_master


### Authentication

- Currently testing with Google OAuth provider

- Review approved services (you can revoke permission here)
  https://myaccount.google.com/permissions
