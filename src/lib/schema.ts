import { integer, text, real, primaryKey, sqliteTable, index } from "drizzle-orm/sqlite-core"
import { sql, relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters"
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const UserStateEnum = z.enum(['new', 'active', 'inactive'] as const);
export const PubStateEnum = z.enum(['draft', 'published', 'dropped'] as const);
export const SpotActionEnum = z.enum([
  'see',      // 看見
  'remove',   // 移除
  'talk',     // 溝通
  'investig', // 調查
  'power',    // 公權力
  'coop',     // 互助
  'downvote', // 扣分
] as const);
export const SpotStateEnum = z.enum(['dirty', 'clean', 'tolerated'] as const);

const userStateCol = (name: string = 'state') => text(name, { enum: UserStateEnum.options }).notNull().default('new');
const incrementIdCol = (name: string = 'id') =>  integer(name).notNull().primaryKey({ autoIncrement: true });
const pubStateCol = (name: string = 'state') => text(name, { enum: PubStateEnum.options }).notNull().default('draft');
const timestampCol = (name: string) => integer(name, { mode: "timestamp" });
const createdAtCol = (name: string = 'createdAt') => timestampCol(name).notNull().default(sql`(unixepoch())`);

export type LatLngBounds = [[number, number], [number, number]];

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
  createdAt: createdAtCol(),
  lockedAt: timestampCol('lockedAt')
})
export const usersRelations = relations(users, ({ many }) => ({
  spots: many(spots),
  areas: many(areas),
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
  id: incrementIdCol(),
  desc: text('desc'),
  createdAt: createdAtCol(),
  userId: text('userId').references(() => users.id),
})

export const spots = sqliteTable("spots", {
  id: incrementIdCol(),
  title: text("title"),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  city: text('city'),
  town: text('town'),
  geohash: text('geohash').notNull(),
  desc: text('desc'),
  state: pubStateCol().notNull(),
  createdAt: createdAtCol(),
  userId: text('userId').references(() => users.id)
}, (table) => {
  return {
    geohashIndex: index('geohash').on(table.geohash),
  }
});

export const spotsRelations = relations(spots, ({ one, many }) => ({
  author: one(users, {
    fields: [spots.userId],
    references: [users.id]
  }),
  followups: many(spotFollowups)
}));

export const spotFollowups = sqliteTable("spotFollowups", {
  id: incrementIdCol(),
  action: text('action', { enum: SpotActionEnum.options }).notNull(),
  spotState: text('spotState', { enum: SpotStateEnum.options }).notNull(),
  desc: text('desc'),
  material: text('material'),
  feedeeCount: integer('feedeeCount'),
  state: pubStateCol().notNull(),
  spawnedAt: timestampCol('spawnedAt'),
  removedAt: timestampCol('removedAt'),
  createdAt: createdAtCol(),
  spotId: integer('spotId').references(() => spots.id),
  userId: text('userId').references(() => users.id)
});

export const spotFollowupsRelations = relations(spotFollowups, ({ one }) => ({
  spot: one(spots, {
    fields: [spotFollowups.spotId],
    references: [spots.id]
  })
}));

export const areas = sqliteTable("areas", {
  id: incrementIdCol(),
  name: text("name"),
  bounds: text("bounds", { mode: 'json' }).notNull().$type<LatLngBounds>(),
  createdAt: createdAtCol(),
  userId: text('userId').references(() => users.id)
});

export const areasRelations = relations(areas, ({ one }) => ({
  user: one(users, {
    fields: [areas.userId],
    references: [users.id]
  })
}));

// }}}
