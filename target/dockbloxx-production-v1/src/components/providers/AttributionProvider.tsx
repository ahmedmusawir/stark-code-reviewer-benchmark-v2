"use client";

import { useEffect } from "react";
import { buildAttribution, persistFirstTouch } from "@/lib/attributionCapture";

/**
 * First-touch attribution capture (E2E-safe).
 *
 * Reads UTM/CAT params, click IDs, referrer classification, and landing page ONCE on mount,
 * then persists to sessionStorage first-touch (never overwrites a value already set this visit).
 * Renders nothing. NO DOM side effects (no history.replaceState, href rewriting, form injection,
 * iframe patching, or polling) — that is what caused the old Coach script's E2E race.
 *
 * Reader: src/lib/attribution.ts. Contract: templates/CONTRACT.md (LOCKED-FINAL).
 */
export default function AttributionProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Atomic first-touch (GUARDRAIL 3 + Finding 1): capture the whole snapshot once per
    // visit, guarded so later landings can't gap-fill absent keys into a chimera record.
    persistFirstTouch(
      window.sessionStorage,
      buildAttribution(
        window.location.search,
        document.referrer,
        window.location.pathname,
        window.location.hostname,
      ),
    );
  }, []);

  return null;
}
