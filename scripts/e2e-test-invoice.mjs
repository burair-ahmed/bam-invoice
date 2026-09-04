import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function clickDigit(page, d) {
  await page.getByRole("button", { name: d, exact: true }).click();
}

async function fillMoney(page, id, value) {
  const el = page.locator(`#${id}`);
  await el.fill("");
  await el.fill(String(value));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  for (const d of ["1", "2", "3", "4"]) await clickDigit(page, d);
  await page.getByRole("button", { name: "Open" }).click();
  await page.waitForURL(/\/(\?|$)/);

  await page.getByRole("link", { name: "Make Invoice" }).click();
  await page.waitForURL(/\/invoice\/new/);

  await page.locator("#transporter").fill("Malik Transport");
  await page.locator("#from").fill("2026-08-01");
  await page.locator("#to").fill("2026-08-31");

  await page.locator("#inv-0").fill("BAM-101");
  await page.locator("#date-0").fill("2026-08-05");
  await fillMoney(page, "fare-0", 50000);
  await fillMoney(page, "advance-0", 10000);
  await fillMoney(page, "detention-0", 500);
  await fillMoney(page, "iTax-0", 2000);
  await fillMoney(page, "unload-0", 1500);
  await page.locator("#veh-0").fill("LES-1234");
  await page.locator("#city-0").fill("Lahore");
  await page.locator("#wt-0").fill("20/25");
  await page.locator("#rec-0").fill("Ali Traders");

  await page.getByRole("button", { name: "Add Trip" }).click();
  await page.locator("#inv-1").fill("BAM-102");
  await page.locator("#date-1").fill("2026-08-12");
  await fillMoney(page, "fare-1", 8000);
  await fillMoney(page, "advance-1", 12000);
  await page.locator("#veh-1").fill("FSD-7788");
  await page.locator("#city-1").fill("Faisalabad");
  await page.locator("#wt-1").fill("10/12");

  await page.locator("#notes").fill("Balance from last month: 2,500");
  await page.locator("#sign").fill("Burair Ahmed");

  await page.waitForTimeout(400);
  const totalsText = await page.locator("form").innerText();
  if (!totalsText.includes("32,000") && !totalsText.includes("32000")) {
    throw new Error(`live totals missing 32000:\n${totalsText.slice(-800)}`);
  }
  if (!totalsText.includes("36,000") && !totalsText.includes("36000")) {
    throw new Error("live totals missing Rec From 36000");
  }

  await page.getByRole("button", { name: "Save and View" }).click();
  await page.waitForURL(/\/invoice\/[a-z0-9-]+$/i, { timeout: 15000 });

  const preview = await page.locator("[data-invoice-root]").innerText();
  const checks = [
    "BURAIR AHMED MOVERS",
    "Malik Transport",
    "BAM-101",
    "BAM-102",
    "LES-1234",
    "Lahore",
    "Ali Traders",
    "FSD-7788",
    "Burair Ahmed",
  ];
  for (const c of checks) {
    if (!preview.includes(c)) throw new Error(`preview missing "${c}"`);
  }
  if (!preview.includes("32,000") && !preview.includes("32000")) {
    throw new Error("preview missing grand total 32000");
  }

  console.log("ok  created Malik Transport invoice in the app");
  console.log("ok  preview URL", page.url());
  console.log("ok  browser checks passed");
} finally {
  await browser.close();
}
