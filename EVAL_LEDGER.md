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
| Specimen Freeze | DockBloxx target @ 059ccdba | COMPLETE | Manifest e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea | 2026-09-15. Provenance CERTIFIED, safety PASS, 362/362 OK. |
| Instrument Freeze | BENCHMARK_BRIEF.md | FROZEN | a14a36fd4a17c3b60048c744f0ee5d3e20fc7979168d79bf749752a377586f30 | 2026-09-15. Benchmark question, roles, pipeline. |
| Instrument Freeze | BENCHMARK_RULES.md | FROZEN | 7cd16c7459bfd0e228d3ea8bbbbc1700d39f03345bc4dfbe59ae09443422ef99 | 2026-09-15. Rules R1–R16. |
| Instrument Freeze | RUN_ORDER.md | FROZEN | d5aee83c9fbfb7bd0b8d98a7fe2ae1971c4bb65c8fc86e01404a61cbe337fb1a | 2026-09-15. Seeded first wave: Fable 5.1, GLM 5.3 Flash, GLM 5.3. Astra deferred fourth (availability, disclosed). |
| Instrument Freeze | EVAL_SCORECARD.md | FROZEN | 3931f16aaedfedf527b8b910971d8a60394c81f10a20036d82bbc0f3043ab177 | 2026-09-15. 12 dimensions, 100 points, raw 0–5 ratings. Withheld from contestants. |
| Instrument Freeze | MODEL_MANIFEST.md | FROZEN FORMAT | 3a129e8f84225df90a8783becd2275f9ee9a1c60ad439b9a5d8fb3248b9c5970 | 2026-09-15. Runtime values TBD until each run. This file's hash will change when runtime values are recorded. |
| Instrument Freeze | templates/CONTESTANT_PROMPT.md | FROZEN | 6f09dd6d4fb619d59865702b2d69fe3190d98f50e843d1159c9afac21f474a95 | 2026-09-15. Identical raw prompt, no rubric, no target-specific hints. |
| Instrument Freeze | templates/RUN_NOTES_TEMPLATE.md | FROZEN | b60bb35dbaf6f1bb45df556ce1f3857f56e95d9f0a150114b211db377de6991b | 2026-09-15. |
| Instrument Freeze | templates/CONTESTANT_CLOSEOUT_TEMPLATE.md | FROZEN | 08a34ead6e6e63dfea13fbbce813bc4d301cbc60e7185806aefaee73b06c947f | 2026-09-15. |
| Instrument Freeze | templates/REFEREE_PROMPT.md | FROZEN | caaef47ab98652260e4d3ea26213e11ddea54c245f053e92a32c69ae72eccc87 | 2026-09-15. Sol blind methodology. |
| Instrument Freeze | Benchmark instrument | COMPLETE | — | 2026-09-15. No contestant has started. |
| Run 1 — Fable 5.1 | contestants/fable-5.1/REVIEW_REPORT.md | COMPLETE / FROZEN | 5c37091b7ff9e2d2691b33dac41f3fd6821ae76370c1deda90031fd7423b670d | 2026-09-15. 35003 bytes, 305 lines. Model `claude-fable-5-1` self-reported. No scoring performed. |
| Run 1 — Fable 5.1 | Target verification | PASS | Manifest e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea | 2026-09-15. 362/362 OK, 0 failures, 362 regular files. |
| Run 1 — Fable 5.1 | Protocol deviation | ACCEPTED — NON-CONTAMINATING | — | Unrecorded Git history command. Director/Jarvis ruling: KEEP RUN 1 — NO RERUN. Custodian note: preserved report does not contain the string `git log`. Referred to Tony. |
| Run 1 — Fable 5.1 | contestants/fable-5.1/RUN_NOTES.md | CLOSED | — | Custodian closeout appended. Run executed in the benchmark repo root, not an isolated workspace copy (R1). |
| Run 2 — GLM 5.3 Flash | contestants/glm-5.3-flash/REVIEW_REPORT.md | COMPLETE / FROZEN | 3175b4ae58ed91e94938c5e9e5079e83fdb2efeb7fc12b15bf9171828637c23c | 2026-09-15. 30434 bytes, 210 lines. Model `glm-5.3-flash:cloud`. No scoring performed. |
| Run 2 — GLM 5.3 Flash | Target verification | PASS | Manifest e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea | 2026-09-15. 362/362 OK, 0 failures, 362 regular files. Custodian manifest verification supplies pinned-SHA integrity proof. Contestant self-verification limit is not a protocol defect. |
| Run 2 — GLM 5.3 Flash | contestants/glm-5.3-flash/RUN_NOTES.md | CLOSED | — | Custodian closeout appended. Run executed in the benchmark repo root, not an isolated workspace copy (R1). |
| Run 3 — GLM 5.3 | contestants/glm-5.3/REVIEW_REPORT.md | COMPLETE / FROZEN | 8a8e5efeb30e5091e2fdb0d2c43566c47f1627b3b8e3f2c9ddcbabdabc91c92f | 2026-09-15. 35148 bytes, 221 lines. Model `glm-5.3:cloud`, Claude Code CLI harness. No scoring performed. |
| Run 3 — GLM 5.3 | Target verification | PASS | Manifest e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea | 2026-09-15. 362/362 OK, 0 failures, 362 regular files. |
| Run 3 — GLM 5.3 | Harness interruption | ACCEPTED — NON-CONTAMINATING | — | One context-compaction mid-run. Same review resumed. Operational interruption, not a protocol failure. |
| Run 3 — GLM 5.3 | contestants/glm-5.3/RUN_NOTES.md | CLOSED | — | Custodian closeout appended. Referred to Tony: contestant-reported read-only benchmark `git log` inspection, and operator global instruction file present in session. Run executed in benchmark repo root (R1). |
