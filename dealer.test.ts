import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getActiveVehicles: vi.fn().mockResolvedValue([]),
  getDealerVehicles: vi.fn().mockResolvedValue([]),
  createVehicle: vi.fn().mockResolvedValue(1),
  updateVehicle: vi.fn().mockResolvedValue(undefined),
  deleteVehicle: vi.fn().mockResolvedValue(undefined),
  getDealerProfile: vi.fn().mockResolvedValue(null),
  getDealerProfileByUserId: vi.fn().mockResolvedValue(null),
  createDealerProfile: vi.fn().mockResolvedValue(1),
  getActiveVehicleCount: vi.fn().mockResolvedValue(0),
  updateDealerSubscription: vi.fn().mockResolvedValue(undefined),
  updateDealerLogo: vi.fn().mockResolvedValue(undefined),
  updateDealerLocation: vi.fn().mockResolvedValue(undefined),
  getMatchingAlerts: vi.fn().mockResolvedValue([]),
  createBuyerAlert: vi.fn().mockResolvedValue(1),
  deactivateBuyerAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test", url: "/manus-storage/test" }),
}));

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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };

  return ctx;
}

function createPublicContext() {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return ctx;
}

describe("dealer.profile", () => {
  it("returns null for a user without a dealer profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dealer.profile();
    expect(result).toBeNull();
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.dealer.profile()).rejects.toThrow();
  });
});

describe("dealer.register", () => {
  it("registers a new dealer with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dealer.register({
      dealerName: "GTA Auto Sales",
      address: "123 Main St, Toronto, ON",
      phone: "(416) 555-0123",
    });

    expect(result).toEqual({ id: 1 });
  });

  it("throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dealer.register({
        dealerName: "Test",
        address: "123 Main St",
        phone: "1234567",
      })
    ).rejects.toThrow();
  });

  it("validates input - rejects empty dealer name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dealer.register({
        dealerName: "",
        address: "123 Main St",
        phone: "1234567",
      })
    ).rejects.toThrow();
  });

  it("validates input - rejects short phone", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dealer.register({
        dealerName: "Test Dealer",
        address: "123 Main St",
        phone: "123",
      })
    ).rejects.toThrow();
  });
});

describe("vehicles.create - limit enforcement", () => {
  it("rejects vehicle creation when no dealer profile exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.vehicles.create({
        title: "Test Car",
        price: 20000,
        daysUntilAuction: 5,
      })
    ).rejects.toThrow("Please complete your dealer registration");
  });

  it("rejects vehicle creation when at vehicle limit", async () => {
    const { getDealerProfile, getActiveVehicleCount } = await import("./db");
    (getDealerProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      dealerName: "Test",
      address: "123 Main",
      phone: "1234567",
      maxVehicles: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (getActiveVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValueOnce(3);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.vehicles.create({
        title: "Test Car",
        price: 20000,
        daysUntilAuction: 5,
      })
    ).rejects.toThrow("reached your limit");
  });
});
