import {
  DEALER_LOCATOR_REST_URL,
  DEALER_REST_COUPONS,
} from "@/constants/apiEndpoints";
import { Dealer } from "@/types/dealer";

export async function fetchAllDealerSlugs() {
  try {
    const response = await fetch(`${DEALER_REST_COUPONS}?_fields=slug`);

    if (!response.ok) throw new Error("Failed to fetch dealer slugs");

    const slugs = await response.json();

    return slugs.map((item: { slug: string }) => item.slug);
  } catch (error) {
    console.error("[fetchAllDealerSlugs] Error:", error);
    return [];
  }
}

export async function fetchDealerPageData(dealerSlug: string) {
  try {
    const response = await fetch(`${DEALER_REST_COUPONS}?slug=${dealerSlug}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 1 min
    });

    if (!response.ok)
      throw new Error(`Failed to fetch data for dealer: ${dealerSlug}`);

    const data = await response.json();

    // console.log("dealer data [dealerServices]", data[0].acf.company_image);

    return data[0]; // Extract only ACF fields for easy consumption
  } catch (error) {
    console.error("[fetchDealerPageData] Error:", error);
    return null;
  }
}

// ============================================================================
// DEALER LOCATOR (ACF repeater)
// ----------------------------------------------------------------------------
// Distinct WP source from the two dealer-coupon functions above. The dealer-
// locator data lives on a single WP page (slug: "dealer-locator") whose ACF
// block contains a "dealer_data" repeater of 15 rows. Data path:
//   data[0].acf.dealer_data
// (the slug query always returns an ARRAY of pages — take [0]).
//
// WP-side field names — dealer_name, dealer_address, dealer_phone,
// dealer_web_url — are deliberately quarantined to this file. The rest of the
// app consumes the clean `Dealer` shape (name / address / phone / website)
// from "@/types/dealer". Do NOT propagate WP naming past this boundary.
//
// Performance: the `&_fields=acf` query trims WP's heavy page payload
// (yoast_head, _links, etc.) down to just the ACF block. revalidate: 30 keeps
// the locator data fresh.
//
// Failure mode: every error path returns [] — the page must never crash on a
// transient WP hiccup or a mis-shaped payload.
// ============================================================================

export async function getDealers(): Promise<Dealer[]> {
  try {
    const response = await fetch(`${DEALER_LOCATOR_REST_URL}&_fields=acf`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) throw new Error("Failed to fetch dealer locator data");

    const data = await response.json();
    const rows = data?.[0]?.acf?.dealer_data;
    if (!Array.isArray(rows)) return [];

    return rows.map(
      (d: {
        dealer_name?: string;
        dealer_address?: string;
        dealer_phone?: string;
        dealer_web_url?: string;
      }): Dealer => ({
        name: d.dealer_name ?? "",
        address: d.dealer_address ?? "",
        phone: d.dealer_phone ?? "",
        website: d.dealer_web_url ?? "",
      })
    );
  } catch (error) {
    console.error("[getDealers] Error:", error);
    return [];
  }
}
