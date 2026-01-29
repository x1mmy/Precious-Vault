import {
  pgTable,
  uuid,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  metalType: text("metal_type")
    .notNull()
    .$type<"gold" | "silver">(),
  weightOz: decimal("weight_oz", { precision: 10, scale: 4 }).notNull(),
  formType: text("form_type")
    .notNull()
    .$type<"bar" | "coin">(),
  denomination: text("denomination").notNull(),
  quantity: integer("quantity").notNull().default(1),
  purchasePriceAud: decimal("purchase_price_aud", {
    precision: 10,
    scale: 2,
  }),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const priceCache = pgTable("price_cache", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  metalType: text("metal_type")
    .notNull()
    .unique()
    .$type<"gold" | "silver">(),
  priceAud: decimal("price_aud", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const priceHistory = pgTable(
  "price_history",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    metalType: text("metal_type")
      .notNull()
      .$type<"gold" | "silver">(),
    priceAud: decimal("price_aud", { precision: 10, scale: 4 }).notNull(),
    recordedDate: text("recorded_date").notNull(), // YYYY-MM-DD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.metalType, t.recordedDate)]
);

export const notificationSettings = pgTable("notification_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyDigestEnabled: boolean("daily_digest_enabled").notNull().default(false),
  discordWebhookUrl: text("discord_webhook_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
