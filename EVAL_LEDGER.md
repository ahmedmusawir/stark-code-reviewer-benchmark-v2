# CR-BENCH-02 — Benchmark Execution Ledger

**Status:** OPEN

Maintained by the evidence custodian as benchmark stages are executed and frozen.

| Stage | Artifact / Run | Status | Frozen SHA / Hash | Notes |
|---|---|---|---|---|
| Scaffold | Benchmark repository tree | COMPLETE | — | Initial CR-BENCH-02 scaffold created |
| Provenance (attempt 1) | DockBloxx target | BLOCKED — PARITY FAILED | Candidate 059ccdba8174cf9c11628002387a9676b1785287 | 2026-09-14. Target missing root `.gitignore` (361 vs 362 files). Superseded by attempt 2. |
| Provenance (attempt 2) | DockBloxx target | PARITY VERIFIED | 059ccdba8174cf9c11628002387a9676b1785287 | 2026-09-14. Target replaced by Tony. Independent archive diff: 362/362 files, 113/113 dirs, identical. |
| Safety (attempt 1) | TARGET_SAFETY_CHECK.md | BLOCKED — POSSIBLE LIVE CREDENTIAL | — | 2026-09-14. Live-shaped GoHighLevel inbound webhook URL in `docs/ghl-attribution/GHL_ATTRIBUTION_SESSION.md:116`. Value not recorded. |
| Discrepancy check | DockBloxx target `.gitignore` | RESOLVED — PARITY PASS | 059ccdba8174cf9c11628002387a9676b1785287 | 2026-09-14. Fresh mktemp re-verification. `.gitignore` present and matching. Archive diff empty. 0 blob/mode mismatches against GitHub commit tree. Earlier "missing" finding stale. |
| Safety disposition | GoHighLevel webhook residue | ACCEPTED KNOWN DOCUMENTATION RESIDUE — NON-BLOCKING | — | 2026-09-15. Tony confirmed abandoned feature residue. Custodian confirmed single occurrence, no `src/` references. Not invoked. Target not edited. |
| Safety | TARGET_SAFETY_CHECK.md | PASS | — | 2026-09-15. No blocking benchmark-distribution issue. |
| Provenance | SPECIMEN_PROVENANCE.md | CERTIFIED | 059ccdba8174cf9c11628002387a9676b1785287 | 2026-09-15. Target identical to pinned source commit excluding `.git`. |
| Freeze | TARGET_MANIFEST.sha256 | VERIFIED | e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea | 2026-09-15. 362/362 SHA-256 entries OK. C-locale sorted, repo-relative paths, no duplicates. |
