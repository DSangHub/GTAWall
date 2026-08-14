import { bigint, boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Dealer profiles — additional info collected via signup form.
 * Linked 1:1 to users table via userId.
 */
export const dealerProfiles = mysqlTable("dealer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  /** FK to users.id */
  userId: int("userId").notNull().unique(),
  /** Dealer business/contact name */
  dealerName: varchar("dealerName", { length: 255 }).notNull(),
  /** Business address */
  address: text("address").notNull(),
  /** Contact phone number */
  phone: varchar("phone", { length: 32 }).notNull(),
  /** Dealer logo/avatar image URL */
  logoUrl: text("logoUrl"),
  /** Dealer website URL (displayed on listings if subscription active) */
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  /** Subscription plan: null = free, monthly = $50/mo, yearly = $500/yr */
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["monthly", "yearly"]),
  /** When the current subscription started */
  subscriptionStartDate: timestamp("subscriptionStartDate"),
  /** When the current subscription expires */
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  /** Stripe customer ID for payment processing */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe subscription ID for active URL display subscription */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  /** Maximum vehicles allowed (default 3) */
  maxVehicles: int("maxVehicles").default(3).notNull(),
  /** Dealer location latitude for geo-search */
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  /** Dealer location longitude for geo-search */
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealerProfile = typeof dealerProfiles.$inferSelect;
export type InsertDealerProfile = typeof dealerProfiles.$inferInsert;

/**
 * Vehicles table — each listing posted by a dealer with an auction countdown.
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  /** The dealer (user) who posted this vehicle */
  dealerId: int("dealerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  price: int("price").notNull(),
  /** Auction deadline as UTC timestamp in milliseconds */
  auctionDeadline: bigint("auctionDeadline", { mode: "number" }).notNull(),
  /** S3 storage key for the vehicle image */
  imageUrl: text("imageUrl"),
  mileage: varchar("mileage", { length: 64 }),
  condition: varchar("condition", { length: 64 }),
  /** Extended description for detail page */
  description: text("description"),
  /** VIN number */
  vin: varchar("vin", { length: 20 }),
  /** Year of the vehicle */
  year: int("year"),
  /** Make (e.g. Ford, Toyota) */
  make: varchar("make", { length: 64 }),
  /** Model (e.g. F-150, Camry) */
  model: varchar("model", { length: 64 }),
  /** Exterior color */
  color: varchar("color", { length: 64 }),
  isPremium: boolean("isPremium").default(false).notNull(),
  /** Whether the listing is active or has been removed/expired */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Buyer alert subscriptions — buyers subscribe to get notified
 * when new vehicles matching their criteria are posted.
 */
export const buyerAlerts = mysqlTable("buyer_alerts", {
  id: int("id").autoincrement().primaryKey(),
  /** Email to notify */
  email: varchar("email", { length: 320 }).notNull(),
  /** Optional: linked user ID if the buyer is logged in */
  userId: int("userId"),
  /** Filter: vehicle make (e.g. "Ford", "Toyota") — null means any */
  make: varchar("make", { length: 64 }),
  /** Filter: vehicle model — null means any */
  model: varchar("model", { length: 64 }),
  /** Filter: max price — null means no limit */
  maxPrice: int("maxPrice"),
  /** Filter: min year — null means any */
  minYear: int("minYear"),
  /** Whether the alert is still active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuyerAlert = typeof buyerAlerts.$inferSelect;
export type InsertBuyerAlert = typeof buyerAlerts.$inferInsert;
