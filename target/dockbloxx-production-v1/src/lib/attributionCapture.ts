/**
 * Attribution Capture — pure, DOM-free logic.
 *
 * Ports Coach's classifyTraffic() reference logic
 * (docs/wp-plugins/attribution-script.md:6-41) into testable functions. The React provider
 * (src/components/providers/AttributionProvider.tsx) supplies the DOM inputs and handles
 * first-touch sessionStorage persistence. This module NEVER touches the DOM.
 *
 * Contract: agent_docs/CURRENT_TASKS/Ticket_2_Solution_Module/templates/CONTRACT.md (LOCKED-FINAL).
 */

export type WcSourceType = "utm" | "organic" | "referral" | "typein";

export interface CapturedAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  source_type: WcSourceType;
  referrer?: string;
  gclid?: string;
  fbclid?: string;
  wbraid?: string;
  gbraid?: string;
  coupon?: string;
  landing_page?: string;
}

// Referrer classification buckets (ported verbatim from Coach's script).
const AI_TOOLS = ["chatgpt.com", "openai.com", "claude.ai", "gemini.google.com", "bard.google.com", "bing.com/chat"];
const SOCIAL = ["facebook.", "t.co", "twitter.", "x.com", "linkedin.", "instagram.", "pinterest.", "reddit.", "tiktok.", "youtube."];
const SEARCH = ["google.", "bing.", "yahoo.", "duckduckgo.", "baidu.", "ecosia."];

const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
type UtmField = (typeof UTM_FIELDS)[number];

export interface ReferrerClassification {
  utm_source: string;
  utm_medium: "ai-referral" | "social" | "organic" | "referral";
}

/**
 * Classify traffic from the referrer. Returns null for empty or internal referrers.
 * Mirrors Coach's classifyTraffic() bucket order: AI -> Social -> Search -> generic referral.
 */
export function classifyReferrer(referrer: string, currentHost: string): ReferrerClassification | null {
  if (!referrer) return null;
  let domain: string;
  try {
    domain = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  // Ignore internal navigation.
  if (currentHost && domain.indexOf(currentHost.toLowerCase()) > -1) return null;

  const has = (list: string[]) => list.some((x) => domain.indexOf(x) > -1);

  if (has(AI_TOOLS)) {
    return { utm_source: domain.replace("www.", ""), utm_medium: "ai-referral" };
  }
  if (has(SOCIAL)) {
    let src = domain.replace("www.", "");
    if (domain.includes("t.co") || domain.includes("x.com")) src = "twitter";
    return { utm_source: src, utm_medium: "social" };
  }
  if (has(SEARCH)) {
    return { utm_source: domain.replace("www.", ""), utm_medium: "organic" };
  }
  return { utm_source: domain, utm_medium: "referral" };
}

/**
 * Per-field UTM-vs-CAT resolution: utm_* wins, cat_* is the fallback.
 * Returns only the fields that had a value.
 */
export function resolveUtmCat(params: URLSearchParams): Partial<Record<UtmField, string>> {
  const out: Partial<Record<UtmField, string>> = {};
  for (const f of UTM_FIELDS) {
    const catKey = f.replace("utm_", "cat_");
    const v = params.get(f) ?? params.get(catKey);
    if (v) out[f] = v;
  }
  return out;
}

/**
 * Derive the WooCommerce source_type enum. Never blank.
 */
export function deriveSourceType(
  hasUtmOrCat: boolean,
  classification: ReferrerClassification | null,
): WcSourceType {
  if (hasUtmOrCat) return "utm";
  if (!classification) return "typein";
  return classification.utm_medium === "organic" ? "organic" : "referral";
}

/**
 * Build the full attribution map from raw DOM inputs. Pure — no sessionStorage here.
 * The provider persists the result first-touch.
 */
export function buildAttribution(
  search: string,
  referrer: string,
  pathname: string,
  currentHost: string,
): CapturedAttribution {
  const params = new URLSearchParams(search);

  // 1. Explicit UTM/CAT params (utm wins per field).
  const utm = resolveUtmCat(params);
  const hasUtmOrCat = Object.keys(utm).length > 0;

  // 2. Referrer classification — only when untagged.
  const classification = hasUtmOrCat ? null : classifyReferrer(referrer, currentHost);

  const result: CapturedAttribution = {
    ...utm,
    source_type: deriveSourceType(hasUtmOrCat, classification),
    landing_page: pathname,
  };

  // 3. Coach-parity: synthesize source/medium from referrer when untagged.
  if (!hasUtmOrCat) {
    if (classification) {
      result.utm_source = classification.utm_source;
      result.utm_medium = classification.utm_medium;
    } else {
      // Direct traffic (no params, no external referrer).
      result.utm_source = "direct";
      result.utm_medium = "(none)";
    }
  }

  // 4. Referrer (raw), click IDs, coupon — captured when present.
  if (referrer) result.referrer = referrer;
  (["gclid", "fbclid", "wbraid", "gbraid", "coupon"] as const).forEach((k) => {
    const v = params.get(k);
    if (v) result[k] = v;
  });

  return result;
}

export const ATTRIBUTION_GUARD_KEY = "attribution_captured";

/**
 * Atomic first-touch persistence (Ticket 2 Finding 1 fix).
 *
 * If the guard key is already set, this visit has captured — do NOTHING. This prevents
 * "chimera" attribution where a later landing in the same session gap-fills keys the first
 * landing left absent (e.g. a typein/direct first touch later acquiring campaign + click IDs).
 * A direct/sparse first landing is still a valid first touch, so the guard is set then too.
 * Otherwise write the whole snapshot in one pass and set the guard. The per-key absence check
 * is kept as belt-and-suspenders.
 */
export function persistFirstTouch(storage: Storage, captured: CapturedAttribution): void {
  if (storage.getItem(ATTRIBUTION_GUARD_KEY) != null) return;
  for (const [key, value] of Object.entries(captured)) {
    if (value != null && value !== "" && storage.getItem(key) == null) {
      storage.setItem(key, String(value));
    }
  }
  storage.setItem(ATTRIBUTION_GUARD_KEY, "1");
}
