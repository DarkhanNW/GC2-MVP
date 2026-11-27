import { test, expect } from "@playwright/test";
import { collectErrors, overflowState } from "../helpers/api-stub.js";

const SHIPPING_TIERS = [
  { region: "Metro Manila", fee: 100, freeShippingMin: 5000 },
  { region: "Luzon", fee: 130, freeShippingMin: 5000 },
  { region: "Visayas", fee: 160, freeShippingMin: 5000 },
  { region: "Mindanao", fee: 180, freeShippingMin: 5000 },
];

const POOLING_REQUEST = {
  _id: "6751a2b3c4d5e6f708090a11",
  customer: {
    name: "Juan Dela Cruz",
    mobile: "09171234567",
    email: "juan@example.com",
    region: "Metro Manila",
  },
  team: "philadelphia-eagles",
  category: "jerseys",
  size: "L",
  qty: 2,
  details: "Hurts #1, Kelly green alternate",
  maxPrice: 4000,
  quotedPrice: 3600,
  poolKey: "philadelphia-eagles|jerseys",
  status: "pooling",
  statusNote: "Waiting for the pool to fill",
  pool: { joined: 5, target: 6, shippingSolo: 900, shippingPooled: 150 },
  createdAt: "2026-11-25T03:40:00.000Z",
};

const DECLINED_REQUEST = {
  _id: "6751a2b3c4d5e6f708090a22",
  customer: {
    name: "Maria Santos",
    mobile: "09181234567",
    email: "maria@example.com",
    region: "Luzon",
  },
  team: "kansas-city-chiefs",
  category: "jerseys",
  size: "M",
  qty: 1,
  details: "Mahomes #15",
  maxPrice: 3000,
  quotedPrice: 3600,
  poolKey: "kansas-city-chiefs|jerseys",
  status: "declined",
  statusNote: "Lowest we can do is ₱3,600",
  createdAt: "2026-11-25T04:10:00.000Z",
};

const ORDERED_REQUEST = {
  _id: "6751a2b3c4d5e6f708090a33",
  customer: {
    name: "Carlo Reyes",
    mobile: "09191234567",
    email: "carlo@example.com",
    region: "Visayas",
  },
  team: "san-francisco-49ers",
  category: "hoodies",
  size: "XL",
  qty: 1,
  details: "",
  maxPrice: 3200,
  quotedPrice: 2900,
  poolKey: "san-francisco-49ers|hoodies",
  status: "ordered",
  statusNote: "Pool filled, ordered from our supplier. Wait for shipping",
  poolFilledAt: "2026-11-26T09:00:00.000Z",
  createdAt: "2026-11-25T05:00:00.000Z",
};

async function installSourcingMock(page, { records = [POOLING_REQUEST, DECLINED_REQUEST, ORDERED_REQUEST], delay = 0 } = {}) {
  await page.route("**/api/shipping-tiers", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SHIPPING_TIERS),
    });
  });

  await page.route("**/api/sourcing-requests/**", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const url = new URL(route.request().url());
    const id = decodeURIComponent(url.pathname.slice("/api/sourcing-requests/".length));
    const record = records.find((r) => r._id === id);
    if (!record) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Sourcing request not found" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(record),
    });
  });
}

let errors;

test.beforeEach(async ({ page }) => {
  errors = collectErrors(page);
});

test.afterEach(async ({}, testInfo) => {
  if (/not found|error|retries|404|malformed/i.test(testInfo.title)) return;
  expect(errors).toEqual([]);
});

test.describe("Request Status screen", () => {
  test("found (pooling): renders status badge, note, ceiling vs price, pool progress, shipping USP, and local delivery fee", async ({ page }) => {
    await installSourcingMock(page);
    await page.goto(`/request-status.html?id=${POOLING_REQUEST._id}`);

    await expect(page.locator(".confirm__title")).toHaveText("Philadelphia Eagles");
    await expect(page.locator(".badge")).toHaveText("Pooling");
    await expect(page.locator(".request-status__note")).toHaveText("Waiting for the pool to fill");
    await expect(page.locator(".request-status__headline")).toHaveText("Your max ₱4,000 · You pay ₱3,600");
    await expect(page.locator("#status-root")).not.toContainText("₱7,200");
    await expect(page.locator("#status-root")).not.toContainText("₱400");
    await expect(page.locator("#status-root")).not.toContainText("₱750");

    const progress = page.locator("progress.pool-progress");
    await expect(progress).toHaveAttribute("value", "5");
    await expect(progress).toHaveAttribute("max", "6");
    await expect(page.locator(".pool__label")).toHaveText("5 of 6 fans joined, ships when full");
    await expect(page.locator(".pool__shipping")).toContainText("₱150 pooled vs ₱900 solo");

    const specs = page.locator(".specs");
    await expect(specs).toContainText("Philadelphia Eagles");
    await expect(specs).toContainText("Team Jerseys");
    await expect(specs).toContainText("L");
    await expect(specs).toContainText("2");
    await expect(specs).toContainText("₱100 (Metro Manila · paid at handover)");
    await expect(specs).toContainText("Hurts #1, Kelly green alternate");
  });

  test("found (declined): renders counter-offer, omits pool progress, and links to submit a new request", async ({ page }) => {
    await installSourcingMock(page);
    await page.goto(`/request-status.html?id=${DECLINED_REQUEST._id}`);

    await expect(page.locator(".badge")).toHaveText("Declined");
    await expect(page.locator(".request-status__note")).toHaveText("Lowest we can do is ₱3,600");
    await expect(page.locator(".request-status__headline")).toHaveText("Your max ₱3,000 · Counter-offer ₱3,600");
    await expect(page.locator("progress")).toHaveCount(0);
    await expect(page.locator("#status-root")).not.toContainText("fans joined");

    const newRequestLink = page.locator('.request-status__actions a[href="request.html"]');
    await expect(newRequestLink).toHaveText("Submit a new request");
  });

  test("found (ordered): omits pool progress when pool key is absent", async ({ page }) => {
    await installSourcingMock(page);
    await page.goto(`/request-status.html?id=${ORDERED_REQUEST._id}`);

    await expect(page.locator(".badge")).toHaveText("Ordered");
    await expect(page.locator(".request-status__note")).toHaveText("Pool filled, ordered from our supplier. Wait for shipping");
    await expect(page.locator(".request-status__headline")).toHaveText("Your max ₱3,200 · You pay ₱2,900");
    await expect(page.locator("progress")).toHaveCount(0);
    await expect(page.locator("#status-root")).not.toContainText("fans joined");
    await expect(page.locator(".specs")).toContainText("₱160 (Visayas · paid at handover)");
  });

  test("escapes customer-typed values and statusNote against XSS", async ({ page }) => {
    const xssPayload = '<img src=x onerror="window.__xss=1">';
    const xssRecord = {
      ...POOLING_REQUEST,
      _id: "6751a2b3c4d5e6f708090a99",
      customer: { ...POOLING_REQUEST.customer, name: xssPayload },
      details: xssPayload,
      statusNote: xssPayload,
    };

    await installSourcingMock(page, { records: [xssRecord] });
    await page.goto(`/request-status.html?id=${xssRecord._id}`);

    await expect(page.locator(".request-status__note")).toHaveText(xssPayload);
    await expect(page.locator(".specs")).toContainText(xssPayload);
    await expect(page.locator("#status-root img")).toHaveCount(0);
    const xssFlag = await page.evaluate(() => window.__xss);
    expect(xssFlag).toBeUndefined();
  });

  test("not found: handles unknown, malformed, missing, and path-traversal ids", async ({ page }) => {
    await installSourcingMock(page);
    const sourcingRequests = [];
    const orderRequests = [];
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.startsWith("/api/sourcing-requests")) sourcingRequests.push(pathname);
      if (pathname.startsWith("/api/orders")) orderRequests.push(pathname);
    });

    await page.goto("/request-status.html");
    await expect(page.locator(".state__title")).toHaveText("We couldn't find that request");
    expect(sourcingRequests).toEqual([]);

    for (const path of [
      "/request-status.html?id=unknown-id",
      "/request-status.html?id=abc",
      "/request-status.html?id=../orders",
    ]) {
      await page.goto(path);
      await expect(page.locator(".state__title")).toHaveText("We couldn't find that request");
      await expect(page).toHaveTitle(/Request not found/);
    }

    expect(orderRequests).toEqual([]);
  });

  test("shows skeleton while loading", async ({ page }) => {
    await installSourcingMock(page, { delay: 600 });
    await page.goto(`/request-status.html?id=${POOLING_REQUEST._id}`);

    await expect(page.locator(".skeleton").first()).toBeVisible();
    await expect(page.locator(".confirm__title")).toHaveText("Philadelphia Eagles");
  });

  test("error with retry: shows API error and retries successfully", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/shipping-tiers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SHIPPING_TIERS),
      });
    });
    await page.route("**/api/sourcing-requests/**", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Database timeout" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(POOLING_REQUEST),
      });
    });

    await page.goto(`/request-status.html?id=${POOLING_REQUEST._id}`);
    await expect(page.locator(".state__title")).toHaveText("Something went wrong");
    await expect(page.locator(".state")).toContainText("Database timeout");

    await page.locator("[data-retry]").click();
    await expect(page.locator(".confirm__title")).toHaveText("Philadelphia Eagles");
    expect(calls).toBe(2);
  });

  test("fits a 375px phone viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const longRecord = {
      ...POOLING_REQUEST,
      details: "Custom jersey with long reference link https://example.com/very/long/path/without/spaces/that/should/wrap/cleanly",
      statusNote: "Superlongstatusnotewithoutspacesthatshouldalsowrapcleanlyonmobileviewports",
    };
    await installSourcingMock(page, { records: [longRecord] });
    await page.goto(`/request-status.html?id=${longRecord._id}`);

    await expect(page.locator(".confirm__title")).toHaveText("Philadelphia Eagles");
    const width = await overflowState(page);
    expect(width.scrollWidth).toBeLessThanOrEqual(width.innerWidth);
  });
});
