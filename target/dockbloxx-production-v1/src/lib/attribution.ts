/**
 * Attribution Utility
 * Reads attribution data from sessionStorage (written first-touch by AttributionProvider).
 */

export interface AttributionData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  source_type?: string | null;
  referrer?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  coupon?: string | null;
  landing_page?: string | null;
}

/**
 * Reads attribution from sessionStorage (keys written first-touch by AttributionProvider,
 * un-prefixed, matching CONTRACT.md).
 */
export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    utm_source: sessionStorage.getItem('utm_source'),
    utm_medium: sessionStorage.getItem('utm_medium'),
    utm_campaign: sessionStorage.getItem('utm_campaign'),
    utm_content: sessionStorage.getItem('utm_content'),
    utm_term: sessionStorage.getItem('utm_term'),
    source_type: sessionStorage.getItem('source_type'),
    referrer: sessionStorage.getItem('referrer'),
    gclid: sessionStorage.getItem('gclid'),
    fbclid: sessionStorage.getItem('fbclid'),
    wbraid: sessionStorage.getItem('wbraid'),
    gbraid: sessionStorage.getItem('gbraid'),
    coupon: sessionStorage.getItem('coupon'),
    landing_page: sessionStorage.getItem('landing_page'),
  };
}

/**
 * Filters out null/undefined values from attribution object
 */
export function cleanAttribution(attribution: AttributionData): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attribution).filter(([_, v]) => v != null && v !== '')
  ) as Record<string, string>;
}