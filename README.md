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

- Remove local db + drizzle meta, then reset with migrations

    pnpm db:delete
    pnpm db:delete && pnpm db:tables && pnpm db:migrate:gen && pnpm db:migrate

- Directly execute commands in D1

    pnpm wrangler d1 execute feeders --command 'PRAGMA table_list'
    pnpm wrangler d1 execute feeders --command 'INSERT INTO users (id, email) VALUES ("foo001", "foo@bar.com")'
    PRAGMA table_xinfo(TABLE_NAME)
    PRAGMA defer_foreign_keys = (on|off)
    SELECT name, sql FROM sqlite_master


## Authentication

- Currently testing with Google OAuth provider

- Review approved services (you can revoke permission here)
  https://myaccount.google.com/permissions


## Directus CMS

http://localhost:8044/admin

First time setup will create default admin user, see cms-log to get username/password.

```bash
pnpm cms
pnpm cms-log
pnpm cms-stop
```

### Asset management

- Make a `public` folder for user upload instead of default as file library root.
- Turn off storage asset transform, let's use other service instead.
- Expect storage is defined with Cloudflare R2 backend, see config in docker-compose.yml. Note the secret text files must not contain EOL character.

### HTML sanitize extension

- https://github.com/licitdev/directus-extension-sanitize-html

  Note the extension is not flexible configurable so I use a dirty customized
  version instead. Need to build and install locally for every change. And it
  is not published so far.

### General WYSIWYG field settings:

- Custom Formats:

```json
[
  {
    "title": "等寬字",
    "inline": "span",
    "classes": "font-mono"
  },
  {
    "title": "圖說",
    "block": "figure",
    "wrapper": true,
    "classes": "feeders-mce-figure"
  },
  {
    "title": "數值表格",
    "block": "table",
    "selector": "table",
    "classes": "feeders-mce-digit"
  }
]
```

- Options Overrides

```json
{
  "fix_list_elements": true,
  "invalid_elements": "img,h1,h2,h3,h4,h5,h6",
  "content_style": "p { padding-block: 0.25rem; } .font-mono { font-family: monospace; }"
}
```

### Other memo

Schema export: http://localhost:8044/schema/snapshot?export=yaml

Key can be generated by `openssl rand -base64 36`


## Build

    pnpm build

With Bundle Analyzer

    ANALYZE=true pnpm build
