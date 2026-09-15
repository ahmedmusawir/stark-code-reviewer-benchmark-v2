# CR-BENCH-02 — Benchmark Rules

**Status:** FROZEN — 2026-09-15

These rules are frozen before contestant #1 begins. They may not be changed during the benchmark. Any deviation that occurs is logged in `EVAL_LEDGER.md` and the affected run notes. It is never silently corrected.

## R1. Identical target

1. Every contestant reviews the frozen specimen at commit `059ccdba8174cf9c11628002387a9676b1785287`.
2. Before each run, the custodian verifies the canonical target against `TARGET_MANIFEST.sha256`: 362/362 OK and exactly 362 regular files.
3. Each contestant works on an exact copy of the target in an isolated workspace. The copy is verified 362/362 OK with exactly 362 regular files before the run starts.
4. The workspace layout is `<workspace>/target/dockbloxx-production-v1/`. The contestant session starts with the repository root as its working directory.
5. The workspace contains no other benchmark artifact. In particular, it contains no scorecard, rules, referee prompt, manifest file, model manifest, run order, ledger, or contestant output.

## R2. Identical prompt

1. Every contestant receives `templates/CONTESTANT_PROMPT.md` verbatim, as the first and only task message.
2. No preamble, system prompt addition, persona, hint, or follow-up task is added by the operator.
3. Tool and runtime defaults of each contestant's own interface are recorded in the run notes. They are not tuned toward the benchmark.

## R3. Isolated contestant sessions

1. Each contestant runs in a fresh session with no prior conversation, memory, or project context about DockBloxx or this benchmark.
2. Persistent memory, project instruction files, and custom agents that could carry benchmark or DockBloxx knowledge are disabled or absent for the run. Anything that cannot be disabled is recorded in the run notes.
3. One session per contestant. A session is not reused across contestants.

## R4. No cross-contestant exposure

1. No contestant sees any other contestant's output, run notes, or scores.
2. Contestant outputs are stored only in the benchmark repository, outside every contestant workspace.

## R5. No coaching after the run begins

1. After the prompt is sent, the operator sends no guidance, clarification, encouragement, or correction.
2. The only permitted operator message is a neutral resume message, `Continue.`, after an interruption, quota event, or tool/session failure. Each use is logged as an operator intervention with time and cause.
3. Permission prompts raised by the contestant's interface may be answered. Any operation permitted is logged. Operations that violate R6 are denied.
4. If a run cannot complete, it is recorded as incomplete. It is not restarted with a modified prompt. A full restart in a fresh session with the identical prompt is permitted only if the first attempt produced no review, and it is logged.

## R6. No source modification and non-destructive verification only

1. Contestants must not modify, add, or delete files inside the repository.
2. Contestants may read, search, and run non-mutating commands.
3. Contestants must not install dependencies, run builds or tests that write into the repository, start the application, or call any external endpoint or service referenced by the repository.
4. The only file a contestant writes is its review, at `../REVIEW_REPORT.md` relative to the repository root.

## R7. Raw reports preserved exactly

1. After the run, the custodian copies the contestant's `REVIEW_REPORT.md` byte-for-byte into `contestants/<slug>/REVIEW_REPORT.md`.
2. If the contestant delivered its review only in the session transcript, the complete final review text is copied verbatim and the fact is logged.
3. The SHA-256 of the preserved raw report is recorded in the run notes and in `EVAL_LEDGER.md`.

## R8. No post-run improvement

1. A preserved raw report is never edited, extended, reformatted, or regenerated.
2. A contestant is never asked to revise, expand, or defend its review.

## R9. Operator intervention logging

Every operator action after the prompt is sent is logged in the run notes with time, action, and reason. This includes resume messages, permission decisions, interruptions, and any rule deviation.

## R10. Target verification after every run

1. After each run, the contestant workspace copy is verified: 362/362 OK and exactly 362 regular files.
2. The canonical target is verified the same way.
3. A failure is recorded in the closeout. The run is flagged. The contestant is not re-run to hide the failure.

## R11. Operational usage separated from technical scoring

1. Runtime, token, cost, quota, and tool-call measurements are recorded in run notes only.
2. They are withheld from Sol and Jarvis.
3. They are reconnected only after blind technical scoring and Jarvis adjudication are frozen, in `reports/OPERATIONAL_USAGE.md`.

## R12. Identities hidden from Sol

1. Blind packaging happens only after all four raw reports are frozen.
2. The custodian assigns REVIEWER_A through REVIEWER_D by a recorded random method and records the mapping in `referee/BLIND_MAPPING.md`, which stays sealed from Sol and Jarvis until reveal.
3. Blind copies are verbatim. The only permitted change is replacing explicit self-identification of a model, vendor, or interface with `[REDACTED-IDENTITY]`. Every redaction is logged with location and count. No other content is altered.
4. Sol and Jarvis do not receive `BENCHMARK_BRIEF.md`, `MODEL_MANIFEST.md`, `RUN_ORDER.md`, run notes, `BLIND_MAPPING.md`, the ledger, or any operational data.

## R13. Sol read-only target inspection

1. Sol works in a physically isolated referee workspace containing the frozen target, the contestant prompt, the scorecard, the referee prompt, and REVIEWER_A through REVIEWER_D.
2. The workspace target copy is verified 362/362 OK before and after the referee run.
3. Sol may inspect the target read-only under the same non-destructive limits as R6.

## R14. Jarvis blind adjudication

1. Jarvis receives the same blind materials as Sol plus Sol's frozen referee report.
2. Jarvis upholds or amends Sol's classifications and dimension ratings. Every amendment carries a written rationale.
3. The adjudicated scorecard is the official technical result.

## R15. Technical scores frozen before reveal

Sol's report and Jarvis's adjudication are each hashed and recorded in `EVAL_LEDGER.md` before reveal. They are not edited afterward.

## R16. Reveal

1. Reveal occurs only after both the Sol report and the Jarvis adjudication are frozen.
2. Only Tony Stark authorizes reveal.
3. After reveal, technical scores are not changed. Post-reveal commentary is labeled as such.
