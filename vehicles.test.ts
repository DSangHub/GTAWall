import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getDealerProfile: vi.fn().mockResolvedValue({
    id: 1, userId: 1, dealerName: "Test", address: "123 Main", phone: "1234567",
    maxVehicles: 3, websiteUrl: null, subscriptionPlan: null,
    subscriptionStartDate: null, subscriptionEndDate: null,
    createdAt: new Date(), updatedAt: new Date(),
  }),
  getDealerProfileByUserId: vi.fn().mockResolvedValue({
    id: 1, userId: 1, dealerName: "Test Dealer", address: "123 Main St", phone: "(416) 555-0123",
    maxVehicles: 3, websiteUrl: "https://testdealer.com",
    subscriptionPlan: "monthly",
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 30 * 86400000),
    createdAt: new Date(), updatedAt: new Date(),
  }),
  getActiveVehicleCount: vi.fn().mockResolvedValue(0),
  createDealerProfile: vi.fn().mockResolvedValue(1),
  updateDealerSubscription: vi.fn().mockResolvedValue(undefined),
  getActiveVehicles: vi.fn().mockResolvedValue([
    {
      id: 1,
      dealerId: 1,
      title: "2022 Ford F-150 XLT",
      price: 28900,
      auctionDeadline: Date.now() + 5 * 86400000,
      imageUrl: null,
      mileage: "32,400 mi",
      condition: "Excellent",
      description: "Great truck",
      vin: "1FTEW1EP5NFA12345",
      year: 2022,
      make: "Ford",
      model: "F-150 XLT",
      color: "White",
      isPremium: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getVehicleById: vi.fn().mockResolvedValue({
    id: 1,
    dealerId: 1,
    title: "2022 Ford F-150 XLT",
    price: 28900,
    auctionDeadline: Date.now() + 5 * 86400000,
    imageUrl: null,
    mileage: "32,400 mi",
    condition: "Excellent",
    description: "Great truck in excellent condition",
    vin: "1FTEW1EP5NFA12345",
    year: 2022,
    make: "Ford",
    model: "F-150 XLT",
    color: "White",
    isPremium: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getDealerVehicles: vi.fn().mockResolvedValue([
    {
      id: 1,
      dealerId: 1,
      title: "2022 Ford F-150 XLT",
      price: 28900,
      auctionDeadline: Date.now() + 5 * 86400000,
      imageUrl: null,
      mileage: "32,400 mi",
      condition: "Excellent",
      description: null,
      vin: null,
      year: 2022,
      make: "Ford",
      model: "F-150 XLT",
      color: null,
      isPremium: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  createVehicle: vi.fn().mockResolvedValue(42),
  updateVehicle: vi.fn().mockResolvedValue(undefined),
  deleteVehicle: vi.fn().mockResolvedValue(undefined),
  getMatchingAlerts: vi.fn().mockResolvedValue([]),
  createBuyerAlert: vi.fn().mockResolvedValue(1),
  deactivateBuyerAlert: vi.fn().mockResolvedValue(undefined),
  updateDealerLogo: vi.fn().mockResolvedValue(undefined),
  updateDealerLocation: vi.fn().mockResolvedValue(undefined),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "vehicles/1/42.jpg", url: "/manus-storage/vehicles/1/42.jpg" }),
}));

// Mock Stripe
vi.mock("./stripe/index", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/test_session",
    id: "cs_test_123",
  }),
}));

function createAuthContext() {
  const user = {
    id: 1,
    openId: "dealer-001",
    email: "dealer@example.com",
    name: "Test Dealer",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

function createPublicContext() {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("vehicles.list", () => {
  it("returns active vehicles for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicles.list();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("2022 Ford F-150 XLT");
    expect(result[0].price).toBe(28900);
  });
});

describe("vehicles.detail", () => {
  it("returns vehicle with dealer info for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicles.detail({ id: 1 });

    expect(result.title).toBe("2022 Ford F-150 XLT");
    expect(result.description).toBe("Great truck in excellent condition");
    expect(result.vin).toBe("1FTEW1EP5NFA12345");
    expect(result.year).toBe(2022);
    expect(result.make).toBe("Ford");
    expect(result.model).toBe("F-150 XLT");
    expect(result.color).toBe("White");
    expect(result.dealer).not.toBeNull();
    expect(result.dealer!.name).toBe("Test Dealer");
    expect(result.dealer!.websiteUrl).toBe("https://testdealer.com");
  });

  it("throws NOT_FOUND for non-existent vehicle", async () => {
    const { getVehicleById } = await import("./db");
    (getVehicleById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.vehicles.detail({ id: 999 })).rejects.toThrow("Vehicle not found");
  });
});

describe("vehicles.myListings", () => {
  it("returns dealer's vehicles for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicles.myListings();

    expect(result).toHaveLength(1);
    expect(result[0].dealerId).toBe(1);
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.vehicles.myListings()).rejects.toThrow();
  });
});

describe("vehicles.create", () => {
  it("creates a new vehicle listing for authenticated dealers", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicles.create({
      title: "2023 Honda Accord",
      price: 32000,
      daysUntilAuction: 5,
      mileage: "10,000 mi",
      condition: "Like New",
      description: "One owner, no accidents",
      year: 2023,
      make: "Honda",
      model: "Accord",
      color: "Silver",
    });

    expect(result).toEqual({ id: 42 });
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.vehicles.create({
        title: "Test Car",
        price: 20000,
        daysUntilAuction: 3,
      })
    ).rejects.toThrow();
  });

  it("validates input - rejects empty title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.vehicles.create({
        title: "",
        price: 20000,
        daysUntilAuction: 3,
      })
    ).rejects.toThrow();
  });

  it("validates input - rejects negative price", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.vehicles.create({
        title: "Test Car",
        price: -100,
        daysUntilAuction: 3,
      })
    ).rejects.toThrow();
  });
});

describe("vehicles.delete", () => {
  it("soft-deletes a vehicle for the owner", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicles.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.vehicles.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("vehicles.uploadImage", () => {
  it("uploads an image and updates the vehicle", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Small 1x1 pixel JPEG in base64
    const tinyJpeg = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP/CABEIAAEAAQMBIgACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAI/9oACAEBAAAAAEf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAECEAAAAH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAEf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwB//9k=";

    const result = await caller.vehicles.uploadImage({
      vehicleId: 42,
      imageBase64: tinyJpeg,
      mimeType: "image/jpeg",
    });

    expect(result.url).toBe("/manus-storage/vehicles/1/42.jpg");
  });
});

describe("dealer.activateSubscription", () => {
  it("creates a Stripe checkout session for monthly subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dealer.activateSubscription({
      websiteUrl: "https://www.mydealer.com",
      plan: "monthly",
      origin: "https://www.gtawall.com",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/test_session");
    expect(result.plan).toBe("monthly");
    expect(result.price).toBe(50);
  });

  it("activates a yearly subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dealer.activateSubscription({
      websiteUrl: "https://www.mydealer.com",
      plan: "yearly",
      origin: "https://www.gtawall.com",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/test_session");
    expect(result.plan).toBe("yearly");
    expect(result.price).toBe(500);
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dealer.activateSubscription({
        websiteUrl: "https://www.mydealer.com",
        plan: "monthly",
        origin: "https://www.gtawall.com",
      })
    ).rejects.toThrow();
  });

  it("validates URL format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dealer.activateSubscription({
        websiteUrl: "not-a-url",
        plan: "monthly",
        origin: "https://www.gtawall.com",
      })
    ).rejects.toThrow();
  });
});
