import { desc, eq, and, gt, lte, count, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, dealerProfiles, buyerAlerts, type InsertVehicle, type InsertDealerProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Vehicle Queries ============

/** Get all active vehicles (public wall) */
export async function getActiveVehicles() {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const results = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.isActive, true),
        gt(vehicles.auctionDeadline, now)
      )
    )
    .orderBy(desc(vehicles.createdAt));

  // Enrich with dealer website URL eligibility
  const enriched = await Promise.all(
    results.map(async (vehicle) => {
      const dealer = await getDealerProfileByUserId(vehicle.dealerId);
      let dealerWebsiteUrl: string | null = null;
      if (
        dealer?.websiteUrl &&
        dealer.subscriptionEndDate &&
        dealer.subscriptionEndDate > new Date()
      ) {
        dealerWebsiteUrl = dealer.websiteUrl;
      }
      return {
        ...vehicle,
        dealerWebsiteUrl,
        dealerName: dealer?.dealerName || null,
        dealerLogoUrl: dealer?.logoUrl || null,
        dealerLatitude: dealer?.latitude ? parseFloat(dealer.latitude) : null,
        dealerLongitude: dealer?.longitude ? parseFloat(dealer.longitude) : null,
      };
    })
  );

  return enriched;
}

/** Get recently expired vehicles (gone to auction) — last 30 days */
export async function getExpiredVehicles(limit = 12) {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const results = await db
    .select({
      id: vehicles.id,
      title: vehicles.title,
      price: vehicles.price,
      auctionDeadline: vehicles.auctionDeadline,
      imageUrl: vehicles.imageUrl,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      dealerName: dealerProfiles.dealerName,
    })
    .from(vehicles)
    .leftJoin(dealerProfiles, eq(vehicles.dealerId, dealerProfiles.userId))
    .where(
      and(
        lte(vehicles.auctionDeadline, now),
        gt(vehicles.auctionDeadline, thirtyDaysAgo)
      )
    )
    .orderBy(desc(vehicles.auctionDeadline))
    .limit(limit);

  return results;
}

/** Get a single vehicle by ID (public) */
export async function getVehicleById(vehicleId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/** Get vehicles posted by a specific dealer */
export async function getDealerVehicles(dealerId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.dealerId, dealerId))
    .orderBy(desc(vehicles.createdAt));

  return results;
}

/** Create a new vehicle listing */
export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(data);
  return result[0].insertId;
}

/** Update a vehicle listing (only by its owner) */
export async function updateVehicle(
  vehicleId: number,
  dealerId: number,
  data: Partial<Pick<InsertVehicle, "title" | "price" | "auctionDeadline" | "imageUrl" | "mileage" | "condition" | "description" | "vin" | "year" | "make" | "model" | "color" | "isPremium" | "isActive">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vehicles)
    .set(data)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.dealerId, dealerId)));
}

/** Delete a vehicle listing (soft delete — set isActive to false) */
export async function deleteVehicle(vehicleId: number, dealerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(vehicles)
    .set({ isActive: false })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.dealerId, dealerId)));
}

// ============ Dealer Profile Queries ============

/** Get dealer profile by userId */
export async function getDealerProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(dealerProfiles)
    .where(eq(dealerProfiles.userId, userId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/** Get dealer profile by dealer profile ID */
export async function getDealerProfileById(profileId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(dealerProfiles)
    .where(eq(dealerProfiles.id, profileId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/** Get dealer profile by the dealer's user ID (for public vehicle detail) */
export async function getDealerProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(dealerProfiles)
    .where(eq(dealerProfiles.userId, userId))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/** Create a dealer profile */
export async function createDealerProfile(data: InsertDealerProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dealerProfiles).values(data);
  return result[0].insertId;
}

/** Update dealer profile subscription and website URL */
export async function updateDealerSubscription(
  userId: number,
  data: {
    websiteUrl?: string | null;
    subscriptionPlan?: "monthly" | "yearly" | null;
    subscriptionStartDate?: Date | null;
    subscriptionEndDate?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dealerProfiles)
    .set(data)
    .where(eq(dealerProfiles.userId, userId));
}

// ============ Admin Queries ============

/** Admin: get all dealers with stats */
export async function getAllDealers() {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: dealerProfiles.id,
      userId: dealerProfiles.userId,
      dealerName: dealerProfiles.dealerName,
      address: dealerProfiles.address,
      phone: dealerProfiles.phone,
      websiteUrl: dealerProfiles.websiteUrl,
      subscriptionPlan: dealerProfiles.subscriptionPlan,
      subscriptionEndDate: dealerProfiles.subscriptionEndDate,
      stripeCustomerId: dealerProfiles.stripeCustomerId,
      stripeSubscriptionId: dealerProfiles.stripeSubscriptionId,
      maxVehicles: dealerProfiles.maxVehicles,
      createdAt: dealerProfiles.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(dealerProfiles)
    .leftJoin(users, eq(dealerProfiles.userId, users.id))
    .orderBy(desc(dealerProfiles.createdAt));

  return results;
}

/** Admin: get all vehicles (including inactive) */
export async function getAllVehicles() {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: vehicles.id,
      dealerId: vehicles.dealerId,
      title: vehicles.title,
      price: vehicles.price,
      auctionDeadline: vehicles.auctionDeadline,
      imageUrl: vehicles.imageUrl,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      isActive: vehicles.isActive,
      isPremium: vehicles.isPremium,
      createdAt: vehicles.createdAt,
      dealerName: dealerProfiles.dealerName,
    })
    .from(vehicles)
    .leftJoin(dealerProfiles, eq(vehicles.dealerId, dealerProfiles.userId))
    .orderBy(desc(vehicles.createdAt));

  return results;
}

/** Admin: get platform stats */
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalDealers: 0, totalVehicles: 0, activeVehicles: 0, activeSubscriptions: 0 };

  const now = Date.now();
  const nowDate = new Date();

  const [dealerCount] = await db.select({ count: count() }).from(dealerProfiles);
  const [vehicleCount] = await db.select({ count: count() }).from(vehicles);
  const [activeVehicleCount] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(and(eq(vehicles.isActive, true), gt(vehicles.auctionDeadline, now)));
  const [subCount] = await db
    .select({ count: count() })
    .from(dealerProfiles)
    .where(gt(dealerProfiles.subscriptionEndDate, nowDate));

  return {
    totalDealers: dealerCount?.count ?? 0,
    totalVehicles: vehicleCount?.count ?? 0,
    activeVehicles: activeVehicleCount?.count ?? 0,
    activeSubscriptions: subCount?.count ?? 0,
  };
}

/** Admin: toggle vehicle active status */
export async function adminToggleVehicle(vehicleId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicles).set({ isActive }).where(eq(vehicles.id, vehicleId));
}

/** Admin: update dealer max vehicles */
export async function adminUpdateDealerLimit(dealerProfileId: number, maxVehicles: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dealerProfiles).set({ maxVehicles }).where(eq(dealerProfiles.id, dealerProfileId));
}

/** Count active (non-expired) vehicles for a dealer */
export async function getActiveVehicleCount(dealerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = Date.now();
  const results = await db
    .select({ count: count() })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.dealerId, dealerId),
        eq(vehicles.isActive, true),
        gt(vehicles.auctionDeadline, now)
      )
    );

  return results[0]?.count ?? 0;
}

/** Update dealer profile logo URL */
export async function updateDealerLogo(userId: number, logoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dealerProfiles)
    .set({ logoUrl })
    .where(eq(dealerProfiles.userId, userId));
}

// ============ Buyer Alert Queries ============

/** Create a buyer alert subscription */
export async function createBuyerAlert(data: {
  email: string;
  userId?: number | null;
  make?: string | null;
  model?: string | null;
  maxPrice?: number | null;
  minYear?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(buyerAlerts).values({
    email: data.email,
    userId: data.userId ?? null,
    make: data.make ?? null,
    model: data.model ?? null,
    maxPrice: data.maxPrice ?? null,
    minYear: data.minYear ?? null,
  });

  return result[0].insertId;
}

/** Get matching buyer alerts for a newly posted vehicle */
export async function getMatchingAlerts(vehicle: {
  make?: string | null;
  model?: string | null;
  price: number;
  year?: number | null;
}) {
  const db = await getDb();
  if (!db) return [];

  // Get all active alerts
  const allAlerts = await db
    .select()
    .from(buyerAlerts)
    .where(eq(buyerAlerts.isActive, true));

  // Filter in-memory for flexible matching
  // If an alert specifies a criterion but the vehicle lacks that field, the alert does NOT match.
  return allAlerts.filter((alert) => {
    if (alert.make) {
      if (!vehicle.make) return false;
      if (alert.make.toLowerCase() !== vehicle.make.toLowerCase()) return false;
    }
    if (alert.model) {
      if (!vehicle.model) return false;
      if (alert.model.toLowerCase() !== vehicle.model.toLowerCase()) return false;
    }
    if (alert.maxPrice && vehicle.price > alert.maxPrice) {
      return false;
    }
    if (alert.minYear) {
      if (!vehicle.year) return false;
      if (vehicle.year < alert.minYear) return false;
    }
    return true;
  });
}

/** Unsubscribe a buyer alert by ID and email */
export async function deactivateBuyerAlert(alertId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(buyerAlerts)
    .set({ isActive: false })
    .where(and(eq(buyerAlerts.id, alertId), eq(buyerAlerts.email, email)));
}

/** Update dealer location (latitude/longitude) */
export async function updateDealerLocation(userId: number, latitude: string, longitude: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(dealerProfiles)
    .set({ latitude, longitude })
    .where(eq(dealerProfiles.userId, userId));
}
