#!/usr/bin/env tsx
/**
 * E2E fixture discovery script.
 *
 * Connects to the WooCommerce backend configured in .env.local
 * (NEXT_PUBLIC_BACKEND_URL + WOOCOM_CONSUMER_KEY/SECRET), pulls a small
 * set of live fixtures, merges them with the static `dealers.json`,
 * and writes `e2e/fixtures/live-data.json`.
 *
 * Why this exists: E2E tests should reference real data via discovery,
 * not hardcoded literals. This decouples test logic from specific
 * dataset records, making tests portable across environments
 * (dev / staging / prod backends, future backend swaps).
 *
 * Run via: npm run fixtures:fetch
 *
 * Failure modes (all exit non-zero, no partial file written):
 *   - missing env var → exit 1 with which var is missing
 *   - Woo REST 4xx/5xx → exit 1 with status + endpoint (no credentials in error)
 *   - no published products / populated category / valid coupon → exit 1
 *   - dealers.json missing → exit 1
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CK = process.env.WOOCOM_CONSUMER_KEY;
const CS = process.env.WOOCOM_CONSUMER_SECRET;

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!BACKEND_URL) fail("NEXT_PUBLIC_BACKEND_URL is not set in .env.local");
if (!CK) fail("WOOCOM_CONSUMER_KEY is not set in .env.local");
if (!CS) fail("WOOCOM_CONSUMER_SECRET is not set in .env.local");

const FIXTURES_DIR = path.join(process.cwd(), "e2e", "fixtures");
const DEALERS_PATH = path.join(FIXTURES_DIR, "dealers.json");
const LIVE_DATA_PATH = path.join(FIXTURES_DIR, "live-data.json");

// --- Minimal Woo response shapes (only the fields we read) ---

interface WooProduct {
  id: number;
  slug: string;
  name: string;
  status: string;
  variations?: number[];
  categories?: { id: number; name: string; slug: string }[];
}

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WooCoupon {
  id: number;
  code: string;
  discount_type: string;
  date_expires: string | null;
  meta_data: { id: number; key: string; value: unknown }[];
}

interface DealersFixture {
  valid_slugs: string[];
  valid_coupon_codes_by_slug: Record<string, string>;
  notes?: string;
}

async function wooFetch<T>(endpoint: string): Promise<T> {
  // WooCommerce REST authenticates via consumer_key/secret query params
  // (matches the existing pattern in src/app/api/get-coupon-by-code/route.ts).
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${BACKEND_URL}/wp-json/wc/v3${endpoint}${sep}consumer_key=${CK}&consumer_secret=${CS}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    // Never include the URL in the error message — it has credentials.
    throw new Error(
      `Woo REST ${resp.status} ${resp.statusText} for endpoint ${endpoint}`
    );
  }
  return (await resp.json()) as T;
}

function isCouponValid(c: WooCoupon): boolean {
  if (!c.date_expires) return true; // never expires
  return new Date(c.date_expires) > new Date();
}

function pickMeta(c: WooCoupon, key: string): unknown {
  const entry = c.meta_data?.find((m) => m.key === key);
  return entry ? entry.value : null;
}

async function main() {
  console.log(`🔄 Fetching fixtures from ${BACKEND_URL}...`);

  // --- Products ---
  const products = await wooFetch<WooProduct[]>(
    "/products?per_page=20&status=publish"
  );
  if (!Array.isArray(products) || products.length === 0) {
    fail(`No published products returned by ${BACKEND_URL}`);
  }

  const firstPublished = {
    id: products[0].id,
    slug: products[0].slug,
    name: products[0].name,
    variations: products[0].variations ?? [],
  };

  const generalPool = products.slice(0, 5).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    variations: p.variations ?? [],
  }));

  // --- Categories ---
  const categories = await wooFetch<WooCategory[]>(
    "/products/categories?per_page=20"
  );
  const accessories = categories.find(
    (c) => c.slug === "accessories" && c.count > 0
  );
  const populated = accessories ?? categories.find((c) => c.count > 0);
  if (!populated) {
    fail(`No populated category found on ${BACKEND_URL}`);
  }

  const populatedCategory = {
    id: populated.id,
    slug: populated.slug,
    name: populated.name,
    product_count: populated.count,
  };

  // --- Coupons ---
  const coupons = await wooFetch<WooCoupon[]>("/coupons?per_page=20");
  const validCoupon = coupons.find(isCouponValid);
  if (!validCoupon) {
    fail(`No valid (non-expired) coupon found on ${BACKEND_URL}`);
  }

  const couponEntry: Record<string, unknown> = {
    code: validCoupon.code,
    discount_type: validCoupon.discount_type,
  };
  const allowedEmails = pickMeta(validCoupon, "_dockbloxx_allowed_emails");
  const percentPer = pickMeta(
    validCoupon,
    "_dockbloxx_discount_percent_per_product"
  );
  if (allowedEmails !== null) couponEntry.allowed_emails = allowedEmails;
  if (percentPer !== null) couponEntry.discount_percent_per_product = percentPer;

  // --- Dealers (static, manually maintained) ---
  if (!fs.existsSync(DEALERS_PATH)) {
    fail(`Static fixture file not found: ${DEALERS_PATH}`);
  }
  const dealers = JSON.parse(
    fs.readFileSync(DEALERS_PATH, "utf-8")
  ) as DealersFixture;

  // --- Compose ---
  const liveData = {
    generated_at: new Date().toISOString(),
    backend_url: BACKEND_URL,
    products: {
      first_published: firstPublished,
      general_pool: generalPool,
    },
    categories: {
      populated: populatedCategory,
    },
    coupons: {
      valid: couponEntry,
    },
    dealers: {
      valid_slugs: dealers.valid_slugs,
      valid_coupon_codes_by_slug: dealers.valid_coupon_codes_by_slug,
    },
  };

  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // Atomic write — write to temp, then rename. Prevents partial files on crash.
  const tmpPath = `${LIVE_DATA_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(liveData, null, 2), "utf-8");
  fs.renameSync(tmpPath, LIVE_DATA_PATH);

  console.log(`✅ Fixtures written to e2e/fixtures/live-data.json`);
  console.log(
    `   Backend: ${BACKEND_URL} | Products sampled: ${generalPool.length} | Coupon: ${validCoupon.code}`
  );
}

main().catch((err: Error) => {
  fail(`Fixture fetch failed: ${err.message}`);
});
