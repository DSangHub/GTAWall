import { describe, expect, it, vi } from "vitest";
import { getPriceConfig, STRIPE_PRICES, STRIPE_PRODUCTS } from "./stripe/products";

describe("Stripe products configuration", () => {
  it("has correct monthly price ($50 = 5000 cents)", () => {
    expect(STRIPE_PRICES.MONTHLY.amount).toBe(5000);
    expect(STRIPE_PRICES.MONTHLY.currency).toBe("cad");
    expect(STRIPE_PRICES.MONTHLY.interval).toBe("month");
  });

  it("has correct yearly price ($500 = 50000 cents)", () => {
    expect(STRIPE_PRICES.YEARLY.amount).toBe(50000);
    expect(STRIPE_PRICES.YEARLY.currency).toBe("cad");
    expect(STRIPE_PRICES.YEARLY.interval).toBe("year");
  });

  it("has product name and description", () => {
    expect(STRIPE_PRODUCTS.WEBSITE_URL_DISPLAY.name).toContain("GTA Wall");
    expect(STRIPE_PRODUCTS.WEBSITE_URL_DISPLAY.description).toBeTruthy();
  });

  it("getPriceConfig returns monthly for 'monthly' plan", () => {
    const config = getPriceConfig("monthly");
    expect(config.amount).toBe(5000);
    expect(config.interval).toBe("month");
  });

  it("getPriceConfig returns yearly for 'yearly' plan", () => {
    const config = getPriceConfig("yearly");
    expect(config.amount).toBe(50000);
    expect(config.interval).toBe("year");
  });
});
