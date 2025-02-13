import sqlite from "better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/better-sqlite3";

import type { InferSelectModel } from "drizzle-orm";

const sqliteDB = sqlite(":memory:");
export const db = drizzle(sqliteDB);

sqliteDB.exec(`
  CREATE TABLE user (
      id TEXT PRIMARY KEY,
      name TEXT,
      favorite_color TEXT
  );
  CREATE TABLE session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user (id)
  );
`);

export const userTable = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    favoriteColor: text("favorite_color"),
  },
  () => []
);

export const sessionTable = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
    expiresAt: integer("expires_at", {
      mode: "timestamp",
    }).notNull(),
  },
  () => []
);

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
