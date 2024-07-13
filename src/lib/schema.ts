import { integer, text, real, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core"
import { sql, relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters"
import { nanoid } from 'nanoid';

const userStateCol = (name: string = 'state') => text(name, { enum: ["new", "active", "inactive"] }).default('new');
const intIdCol = (name: string = 'id') =>  integer(name).notNull().primaryKey({ autoIncrement: true });
const pubStateCol = (name: string = 'state') => text(name, { enum: ["draft", "published", "dropped"] }).default('draft');
const createdAtCol = (name: string = 'createdAt') => integer(name, { mode: "timestamp" }).default(sql`(unixepoch())`);

// Auth.js tables
// Ref: https://auth-docs-git-feat-nextjs-auth-authjs.vercel.app/reference/adapter/drizzle#sqlite
// {{{

export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey().$defaultFn(nanoid),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  state: userStateCol(),
  image: text("image"),
  createdAt: createdAtCol()
})
export const usersRelations = relations(users, ({ many }) => ({
  spots: many(spots)
}));

export const accounts = sqliteTable('accounts', {
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: createdAtCol()
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId)
  })
)

export const sessions = sqliteTable('sessions', {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull()
})

export const verificationTokens = sqliteTable("verification_tokens", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull()
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token)
  })
)

// }}}


// App tables
// {{{

export const profiles = sqliteTable('profiles', {
  id: intIdCol(),
  desc: text('desc'),
  createdAt: createdAtCol(),
  userId: text('user_id').references(() => users.id),
})

export const spots = sqliteTable("spots", {
  id: intIdCol(),
  title: text("title"),
  lat: real("lat"),
  lon: real("lon"),
  desc: text('desc'),
  state: pubStateCol(),
  createdAt: createdAtCol(),
  userId: text('user_id').references(() => users.id)
})

export const spotsRelations = relations(spots, ({ one }) => ({
  author: one(users, {
    fields: [spots.userId],
    references: [users.id]
  }),
}));

// }}}
