# CR-BENCH-02 — Referee Workspace Manifest

**Status:** BLIND PACKAGE READY / ISOLATED SOL WORKSPACE NOT YET BUILT

Defines exactly what the physically isolated Sol referee workspace may contain. The workspace has not been built yet.

## Permitted contents

| # | Item | Source | Notes |
|---:|---|---|---|
| 1 | Frozen target | `target/dockbloxx-production-v1` | Read-only. Verify 362/362 OK and 362 regular files before and after the referee run. |
| 2 | Target manifest | `TARGET_MANIFEST.sha256` | 362 entries. Manifest file SHA-256 `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea`. |
| 3 | Evaluation scorecard | `EVAL_SCORECARD.md` | Frozen 12-dimension, 100-point instrument. |
| 4 | Contestant prompt | `templates/CONTESTANT_PROMPT.md` | The identical raw prompt every contestant received. |
| 5 | Referee prompt | `templates/REFEREE_PROMPT.md` | Frozen blind referee methodology. |
| 6 | REVIEWER_A | `referee/blind/REVIEWER_A.md` | SHA-256 `9f80246eaec84652fa792cba7a39e2975a70244a08eff54f2836fd0843bf8abe` |
| 7 | REVIEWER_B | `referee/blind/REVIEWER_B.md` | SHA-256 `4e3f95321034a4ab7050402bcbf951238a98d24bc15fd3987faeb7d60d4a5da8` |
| 8 | REVIEWER_C | `referee/blind/REVIEWER_C.md` | SHA-256 `00acc492ab31fb07c02df80f34f87dd2c617dcca247192440161b69b3499b554` |
| 9 | REVIEWER_D | `referee/blind/REVIEWER_D.md` | SHA-256 `585be90059dd4c5fffae53db29d6bb6f8e45ecb883acd3393fffe9a35badbcd9` |

Nothing else may be placed in the workspace.

## Explicitly excluded

- `referee/BLIND_MAPPING.md`
- All contestant folders (`contestants/**`), including raw reports and run notes
- `MODEL_MANIFEST.md`
- `EVAL_LEDGER.md`
- `BENCHMARK_BRIEF.md` (contains contestant identities)
- `RUN_ORDER.md`
- Operational usage and economics of any kind, including runtime, tokens, cost, quota and request counts
- Provider and model identities
- Prior benchmark reports
- Report and output folders (`reports/**`)

The benchmark brief was removed from the permitted list because it names the contestants. The referee prompt carries the referee-facing framing instead.

## Allowed referee operations

- Read the target, the blind reports, the scorecard, and the two prompts.
- Search and run non-mutating commands for verification.
- No installs, builds, repository-writing tests, application start, or external calls (BENCHMARK_RULES R13 and R6).
- Write exactly one output file: the Sol referee report.

## Workspace integrity

- Verify the workspace target copy 362/362 OK with 362 regular files before and after the referee run.
- Verify each blind artifact against the SHA-256 values above before the run.
- Record results in `EVAL_LEDGER.md`.
