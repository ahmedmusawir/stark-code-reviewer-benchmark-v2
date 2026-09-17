# STARK CODE REVIEWER BENCHMARK — ROUND TWO

**Benchmark ID:** CR-BENCH-02
**Title:** DockBloxx Production Code Reviewer Championship
**Status:** COMPLETE / REVEALED
**Compiled:** 2026-09-17 by the benchmark evidence custodian
**Operator and reveal authority:** Tony Stark
**Primary blind referee:** Sol — High reasoning
**Blind adjudicator:** Jarvis

**Evidence classes used throughout this report.** Every material statement is labeled or clearly attributable to one of these:

| Class | Meaning |
|---|---|
| FACT | Verifiable from repository artifacts, hashes, or the frozen target |
| REFEREE JUDGMENT | Sol's adjudication or rating, upheld by Jarvis; not re-derived here |
| OPERATOR OBSERVATION | Reported or screenshot-captured by Tony; not independently verified |
| INFERENCE | Custodian reasoning from the above, marked as such |
| FUTURE HYPOTHESIS | Not established by this benchmark |

Frozen scores are reproduced exactly. Nothing in this report re-scores, re-ranks, or revises any contestant, referee, or adjudication artifact.

---

## 1. Executive Summary

CR-BENCH-02 measured natural, uncoached senior/principal code-review ability. Four AI models each reviewed one identical frozen production specimen under identical conditions, with no scoring rubric, no expected-findings list, no playbook, and no sight of each other's work.

**Specimen (FACT).** DockBloxx production storefront, pinned at commit `059ccdba8174cf9c11628002387a9676b1785287`, 362 regular files, certified against a SHA-256 manifest and verified 362/362 OK before and after every run.

**Contestants (FACT).** Astra, Fable 5.1, GLM 5.3, GLM 5.3 Flash.

**Blind architecture (FACT).** The four frozen raw reports were packaged as REVIEWER_A through REVIEWER_D under a sealed random mapping. Sol scored them blind in a physically isolated workspace that contained no identities, no economics, and no mapping. Jarvis audited Sol's scoring while identities were still sealed. Only then did Tony authorize reveal.

**Final ranking (REFEREE JUDGMENT, frozen).**

| Rank | Contestant | Score / 100 | Frozen grade |
|---:|---|---:|:---:|
| 1 | Astra | 95.60 | A |
| 2 | Fable 5.1 | 90.00 | A |
| 3 | GLM 5.3 | 85.00 | B |
| 4 | GLM 5.3 Flash | 71.20 | C |

Astra additionally carries a human-facing presentation label of **A+**. This is a presentation label only. The frozen CR-BENCH-02 scorecard defines 90.00 and above as grade A, and Astra's frozen technical grade is A, identical in band to Fable 5.1's.

**Principal conclusion (REFEREE JUDGMENT + INFERENCE).** All four models correctly identified the specimen's central failure: the browser is treated as the financial ledger, so order status, charge amount, and discount authority are decided client-side without server reconciliation. The separation between them was not that discovery. It was validity under scrutiny, restraint about what static evidence can prove, and the ability to find ordinary-user correctness defects that are invisible to a pure security sweep. The top two reports were separated by depth of verification rather than breadth of coverage. The bottom score was driven down by one demonstrably false claim about live code plus several material omissions, not by weak architectural understanding.

---

## 2. Benchmark Question

The frozen question, preserved verbatim from `BENCHMARK_BRIEF.md`:

> Which of Astra, Fable 5.1, GLM 5.3, and GLM 5.3 Flash naturally produces the strongest independent senior/principal code review of the exact same frozen DockBloxx production snapshot under equal review conditions?

---

## 3. Experimental Design

All items in this section are FACT, drawn from `BENCHMARK_RULES.md` (rules R1 through R16, frozen 2026-09-15 before contestant 1 began), `templates/CONTESTANT_PROMPT.md`, and `templates/REFEREE_PROMPT.md`.

**Raw, uncoached review.** Contestants received one task message and no further guidance. No coaching, clarification, or correction was permitted after the prompt was sent. The only allowed operator message was a neutral resume after an interruption.

**Identical frozen target.** Every contestant reviewed the same pinned commit. The canonical target was verified against the manifest before and after each run.

**Identical prompt.** The same frozen prompt text was issued to all four contestants. It asked for material defects, security and trust-boundary issues, state and concurrency problems, architecture and root-cause problems, integration failures, test and verification weaknesses, and operationally important risks. It required prioritization, concrete evidence, and explicit separation of proven findings from conditional concerns.

**Contestant isolation.** Fresh sessions, no cross-contestant visibility, and no access to another contestant's output.

**No scoring criteria shown to contestants.** The 12-dimension scorecard was withheld from all four. None of them knew which dimensions would be measured or how they were weighted.

**Blind A/B/C/D packaging.** After all four raw reports were frozen and hashed, each was copied verbatim into a blind slot under a sealed random mapping. Only identity-revealing text was redacted, and every redaction was logged.

**Sol High referee.** Sol scored the four anonymous reports against the frozen rubric in an isolated workspace containing only the target, the manifest, the scorecard, both prompts, and the four blind reports.

**Jarvis blind adjudication.** Jarvis audited Sol's arithmetic, grade assignment, rank ordering, classification consistency, and rubric application before any identity was revealed.

**Tony reveal authority.** Reveal occurred only after the referee report and the adjudication were frozen.

---

## 4. Target Provenance

All FACT, from `SPECIMEN_PROVENANCE.md`, `TARGET_SAFETY_CHECK.md`, `TARGET_MANIFEST.sha256`, and `EVAL_LEDGER.md`.

| Property | Value |
|---|---|
| Source repository | https://github.com/ahmedmusawir/dockbloxx-production-v1 |
| Pinned source commit | `059ccdba8174cf9c11628002387a9676b1785287` |
| Commit tree object | `4879d4712e223a816ff621dd29bcd04c2f66ca51` |
| Regular files | 362 |
| Directories | 113 |
| Symlinks | 0 |
| Manifest entries | 362 |
| Manifest verification | 362/362 OK, 0 failures, at every checkpoint |
| Manifest file SHA-256 | `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea` |

**Verification method.** The remote reference was resolved read-only. The pinned commit was materialized independently in temporary directories outside the benchmark repository, and the target was compared recursively against it. A second, independent check compared every target file's git blob ID and file mode against GitHub's own tree listing for the commit, which reported 362 blobs, no submodules, and no symlinks. Both checks agreed exactly.

**Git removal.** The target carries no `.git`, `.gitmodules`, `.hg`, or `.svn` anywhere. It is a dead snapshot. Contestants could not mine the specimen's own history for intent.

**.gitignore provenance incident and resolution.** The first certification attempt on 2026-09-14 FAILED parity: the source at the pinned commit contained a root `.gitignore` that the target lacked, 362 files against 361. The custodian stopped, made no repair, and reported the mismatch with the missing file's hash. Tony replaced the target from a fresh clone of the pinned commit with only `.git` removed. Re-certification then passed at 362/362. A later independent discrepancy check re-confirmed the restored file byte-for-byte and found zero blob or mode mismatches against the commit tree. The incident is recorded in the ledger rather than being silently corrected, and the superseded attempt remains in the record.

**GHL documentation residue disposition.** The safety preflight initially blocked on a live-shaped GoHighLevel inbound webhook URL in `docs/ghl-attribution/GHL_ATTRIBUTION_SESSION.md` line 116. The custodian verified that the exact URL, its location ID, and its trigger ID appear only on that one line of that one file, that no file under `src/` references the service, and that it is the only live-shaped hook URL in the specimen. The webhook was never invoked and the target was never edited. Tony confirmed it as abandoned feature residue outside active runtime behavior, and it was recorded as **ACCEPTED KNOWN DOCUMENTATION RESIDUE — NON-BLOCKING**. The value itself is not recorded in any benchmark artifact.

**Other safety results.** No `.env` or key or certificate or service-account files. No private-key blocks. No Stripe live, restricted, or webhook secrets. No AWS, GitHub, Slack, Google API, JWT, or literal bearer tokens. The only other credential-shaped hits were a Stripe publishable test key, asterisk-masked documentation placeholders, and environment-variable references holding no values. Final disposition: **PASS — SAFE TO FREEZE FOR BENCHMARK**.

**No symlinks.** Zero symlinks and zero non-regular, non-directory entries, confirmed both on disk and in the commit tree.

---

## 5. Contestants and Runtime Manifest

Runtime data is reproduced only where evidence exists. Unknown values remain unknown.

| Contestant | Runtime / model identifier | Provider or interface | Reasoning setting | Run date | Evidence class |
|---|---|---|---|---|---|
| Astra | `gpt-6-astra` | Codex session | high | 2026-09-16 | OPERATOR OBSERVATION (screenshot). The contestant session itself could not expose an identifier and recorded UNKNOWN, identifying only as Codex based on GPT-6. |
| Fable 5.1 | `claude-fable-5-1` | Claude Code CLI, auto mode | NOT RECORDED | 2026-09-15 | Contestant self-reported, not independently verified |
| GLM 5.3 | `glm-5.3:cloud` | Claude Code CLI harness | NOT RECORDED | 2026-09-15 | Contestant self-reported, not independently verified |
| GLM 5.3 Flash | `glm-5.3-flash:cloud` | NOT RECORDED | NOT RECORDED | 2026-09-15 | Contestant self-reported, not independently verified |

Vision capability was not recorded for any contestant and is not claimed.

**Custodian record note (FACT).** `MODEL_MANIFEST.md` currently carries the fully populated Astra entry, while the Fable 5.1, GLM 5.3, and GLM 5.3 Flash entries still read TBD even though their identifiers are recorded in the execution ledger and in each contestant's run notes. This report uses the ledger and run-notes values. The manifest file itself was not edited during report compilation.

---

## 6. Run Order and Execution Record

**Frozen order (FACT), from `RUN_ORDER.md`.** The first wave was randomized among the three available contestants using a seed fixed before the draw, namely the SHA-256 of the frozen manifest file, with the draw computed once and no re-draws. Astra was unavailable for the first wave and was therefore explicitly scheduled as the deferred fourth run. That scheduling constraint was disclosed in the frozen instrument, and Astra's position was never randomized.

| Run | Contestant | Date | Raw report | Target after run |
|---:|---|---|---|---|
| 1 | Fable 5.1 | 2026-09-15 | 35003 bytes, 305 lines | 362/362 OK |
| 2 | GLM 5.3 Flash | 2026-09-15 | 30434 bytes, 210 lines | 362/362 OK |
| 3 | GLM 5.3 | 2026-09-15 | 35148 bytes, 221 lines | 362/362 OK |
| 4 | Astra | 2026-09-16 | 32004 bytes, 239 lines | 362/362 OK |

No contestant modified the target. Every run changed only its own two contestant files.

### Deviations and interruptions, as recorded

These are reproduced at the weight the record gives them. None was found to affect scoring, and Sol saw none of them.

**Run 1, Fable 5.1 — Git history logging ambiguity. Ruling: KEEP RUN 1 — NO RERUN (OPERATOR OBSERVATION + FACT).** The deviation as recorded states that the raw report mentions `git log` use during review while the exact command was not recorded and could not later be reconstructed. A follow-up established no evidence that restricted benchmark methodology, scorecard, referee files, or other contestant outputs were viewed, that only harmless benchmark Git metadata or commit subjects are known to have been visible, and that no contamination evidence was found. The Director and Jarvis ruled to keep the run. **Custodian note (FACT):** the preserved report at its frozen hash does not contain the string `git log`; its only history statement is that Git history was not inspected for intent. That mismatch was referred to Tony and did not change the ruling.

**Run 3, GLM 5.3 — context compaction (FACT).** One harness context compaction occurred mid-run. The contestant resumed the same review afterward. No forbidden benchmark files were reported accessed, no target file was modified, and no Git writes occurred. Recorded as an operational interruption, not a protocol failure. The contestant's notes also list read-only `git branch`, `log`, and `status` inspection of the benchmark repository, and cite the operator's global instruction file as the reason it performed no Git writes. Both were logged and referred to Tony.

**Run 4, Astra — verification-method difference. ACCEPTED / NON-BLOCKING (FACT).** Astra used permitted read-only source inspection plus controlled in-memory execution with fakes and synthetic credentials. The other three contestants used static inspection only. No target or external system was modified. Different evidence-gathering depth was accepted as part of natural reviewer behavior.

**Run 4, Astra — write-location clarification. ACCEPTED / NON-BLOCKING (FACT).** The operator launch wrapper authorized Astra to write only its own review report and run notes, matching the same mechanical authorization given to all contestants. The frozen substantive review assignment was not changed.

**Workspace deviation common to all four runs (FACT).** Every contestant ran in the benchmark repository root rather than in an isolated workspace copy as rule R1 describes, and each wrote directly into its own contestant folder. This was uniform across all four runs, so it did not advantage any single contestant, but it is the reason the Run 1 and Run 3 history-inspection notes matter at all. It is recorded here rather than minimized.

---

## 7. Frozen Evaluation Instrument

FACT, from `EVAL_SCORECARD.md`, frozen 2026-09-15 and withheld from contestants.

| # | Dimension | Weight |
|---:|---|---:|
| 1 | Finding validity | 15 |
| 2 | Important-issue coverage | 15 |
| 3 | Evidence quality | 10 |
| 4 | Severity calibration | 7 |
| 5 | Confidence / epistemic discipline | 7 |
| 6 | Security / trust-boundary reasoning | 8 |
| 7 | Logic / state / concurrency | 8 |
| 8 | Architecture / root-cause reasoning | 8 |
| 9 | Test-quality reasoning | 6 |
| 10 | Scope discipline / signal-to-noise | 5 |
| 11 | Operational usefulness | 6 |
| 12 | Independent reviewer judgment | 5 |
| | **Total** | **100** |

**Raw 0–5 capability rating.** Each dimension receives one integer rating: 0 absent or wholly incorrect, 1 very weak, 2 weak, 3 competent with notable gaps, 4 strong with minor gaps, 5 exceptional and principal-level.

**Weighted formula.** `weighted score = (raw rating / 5) × dimension weight`, reported to two decimals.

**Total.** The sum of the twelve weighted scores, maximum 100.

**Grade bands.** A is 90.00 to 100.00, B is 80.00 to 89.99, C is 70.00 to 79.99, D is 60.00 to 69.99, F is below 60.00. Rank is by weighted total descending, and equal totals are reported as ties rather than broken artificially.

---

## 8. Blind Referee Method

FACT as to method, from `templates/REFEREE_PROMPT.md` and Sol's own report.

Sol evaluated only the four anonymous reports, the frozen prompts and scorecard, and the frozen target. It made no attempt to infer identities, used no network, installed nothing, built and ran nothing, and modified nothing.

**Issue-family consolidation.** Sol first normalized all four reports into consolidated issue families, so repeated descriptions of the same root defect could not inflate coverage. The consolidation produced 32 families, F-001 through F-032, each recording which reviewers reported it and how each instance was adjudicated.

**Classification vocabulary**, applied per reviewer per family:

| Class | Meaning as applied |
|---|---|
| VALID | Materially correct as described |
| PARTIAL | A real issue, but with a material scope, evidence, or severity error |
| INVALID | Does not exist as described |
| DUPLICATE | The same reviewer already covered the same issue |
| NOT ADJUDICABLE | The frozen source cannot determine the external condition |

Conditional impact was never treated as proven impact.

**Significant misses.** Sol listed only material omissions, each with source evidence and the reviewers that missed it.

**Unique valid findings.** Sol recorded, per reviewer, materially useful findings reported by that reviewer alone, and explicitly declined to credit conditional or low-materiality uniqueness.

**Source verification.** Verification was static against the frozen target. Sol inspected every cited API route, the checkout, payment, cart, coupon, shipping, variation, pagination, and thank-you paths, deployment files, package manifests and lockfile, and test configuration, using read-only searches to check webhook handlers, middleware, reset and clear call sites, limiter call sites, environment wiring, dependency declarations, missing fixtures, and public route structure.

---

## 9. Blind Results

REFEREE JUDGMENT, frozen, as scored before any identity was known.

| Blind reviewer | Total / 100 | Grade | Rank |
|---|---:|:---:|---:|
| REVIEWER_C | 95.60 | A | 1 |
| REVIEWER_A | 90.00 | A | 2 |
| REVIEWER_B | 85.00 | B | 3 |
| REVIEWER_D | 71.20 | C | 4 |

Sol recorded no ties.

---

## 10. Jarvis Blind Adjudication

FACT, from `referee/JARVIS_ADJUDICATION.md`, completed while the identity mapping was still sealed.

**Ruling: ACCEPT SOL SCORES AS WRITTEN. NO SCORE CHANGES.**

Jarvis verified all twelve weighted calculations per reviewer, all four totals, grade assignments, rank ordering, duplicate handling, validity and partial and invalid adjudication, significant-miss treatment, unique-finding treatment, consistent rubric application, separation of conditional external behavior from proven source behavior, and the absence of identity, economics, or provider influence in scoring. No adjustments were required.

---

## 11. Reveal

FACT, from the sealed mapping, opened only after both the referee report and the adjudication were frozen.

| Blind slot | Contestant |
|---|---|
| REVIEWER_A | Fable 5.1 |
| REVIEWER_B | GLM 5.3 |
| REVIEWER_C | Astra |
| REVIEWER_D | GLM 5.3 Flash |

The assignment was drawn once from an operating-system random seed recorded in the sealed file, and the mapping existed nowhere else in the repository before reveal.

---

## 12. Final Championship Table

| Rank | Contestant | Score / 100 | Grade |
|---:|---|---:|---|
| 1 | Astra | 95.6 | A technically / A+ presentation label |
| 2 | Fable 5.1 | 90.0 | A |
| 3 | GLM 5.3 | 85.0 | B |
| 4 | GLM 5.3 Flash | 71.2 | C |

The A+ against Astra is a human-facing presentation label chosen by the operator. The frozen CR-BENCH-02 instrument has no A+ band. Under the frozen scorecard, 90.00 and above is grade A, so Astra and Fable 5.1 hold the same frozen letter grade despite the 5.60-point gap.

---

## 13. Full 12-Dimension Comparison

REFEREE JUDGMENT. Sol's actual raw 0–5 dimension ratings, mapped to revealed identities.

| Dimension | Weight | Astra | Fable 5.1 | GLM 5.3 | GLM 5.3 Flash |
|---|---:|---:|---:|---:|---:|
| Finding validity | 15 | 5 | 4 | 4 | 3 |
| Important-issue coverage | 15 | 4 | 4 | 4 | 3 |
| Evidence quality | 10 | 5 | 5 | 5 | 4 |
| Severity calibration | 7 | 4 | 4 | 3 | 3 |
| Confidence / epistemic discipline | 7 | 5 | 5 | 4 | 3 |
| Security / trust-boundary reasoning | 8 | 5 | 5 | 5 | 4 |
| Logic / state / concurrency | 8 | 5 | 4 | 4 | 3 |
| Architecture / root-cause reasoning | 8 | 5 | 5 | 5 | 5 |
| Test-quality reasoning | 6 | 5 | 5 | 4 | 4 |
| Scope discipline / signal-to-noise | 5 | 5 | 4 | 4 | 4 |
| Operational usefulness | 6 | 5 | 5 | 5 | 4 |
| Independent reviewer judgment | 5 | 5 | 5 | 4 | 4 |
| **Weighted total** | **100** | **95.60** | **90.00** | **85.00** | **71.20** |

Observations that follow directly from the matrix (INFERENCE): architecture and root-cause reasoning was the one dimension where all four scored identically at 5, so architectural diagnosis did not discriminate between these models at all. Every point of separation came from validity, coverage, calibration, epistemic discipline, and state or concurrency reasoning.

---

## 14. Model Profiles

Each profile reproduces Sol's frozen ratings and characterizations. No personality or capability claim is added beyond the referee record.

### 14.1 Astra — 95.60 / 100 — Grade A (presentation label A+), Rank 1

**Weighted fingerprint.**

| Dimension | Raw /5 | Weighted |
|---|---:|---:|
| Finding validity | 5 | 15.00 |
| Important-issue coverage | 4 | 12.00 |
| Evidence quality | 5 | 10.00 |
| Severity calibration | 4 | 5.60 |
| Confidence / epistemic discipline | 5 | 7.00 |
| Security / trust-boundary reasoning | 5 | 8.00 |
| Logic / state / concurrency | 5 | 8.00 |
| Architecture / root-cause reasoning | 5 | 8.00 |
| Test-quality reasoning | 5 | 6.00 |
| Scope discipline / signal-to-noise | 5 | 5.00 |
| Operational usefulness | 5 | 6.00 |
| Independent reviewer judgment | 5 | 5.00 |
| **Total** | | **95.60** |

**Strongest dimensions (REFEREE JUDGMENT).** Finding validity, evidence quality, epistemic discipline, logic and state and concurrency, scope discipline. Sol recorded the cleanest validity record in the field and best-in-set evidence, describing the bounded in-memory probes as establishing handler arguments and control flow without claiming live WooCommerce, browser, Stripe, or deployment behavior.

**Important valid findings.** The central authorization, money-authority, lifecycle, and idempotency failures, plus live coupon and shipping correctness beyond the fabricated-request attack, the locked Sharp engine requirement against the Node 18 container, and a precise account of why the existing tests and deployment gate do not establish the key invariants.

**Unique valid findings.** Zero-priced complex variations reaching the cart; both category pagination defects, namely the unfiltered fetch with mis-seeded direct loads and the stale-request namespace corruption; the exact `notFound()` control-flow trigger for process termination; and the Sharp and Node engine mismatch.

**Important misses.** Secondary breadth: coupon expiry time and dead fixed-product math, the latent cart-key contract, client-side personal-data persistence beyond the latest order, the serialized and undeclared limiter architecture, absolute and missing environment wiring, CMS script and header hardening, metadata and public placeholder issues, and silent checkout account creation.

**False or partial claims.** Sol found no material false claim. Two conditional integration concerns were classified NOT ADJUDICABLE as deployed effects and were explicitly framed that way by the reviewer itself.

**Referee characterization.** Highest validity and epistemic discipline; best targeted verification; discovers the most valuable unique correctness and state issues; excellent idempotency, concurrency, and test-invariant reasoning. Weaker on breadth across coupon, persistence, limiter, hardening, and deployment families. Sol also noted that Astra's caller-controlled payment and discount authority findings could reasonably have been elevated from P1 to P0, which is why severity calibration sits at 4 rather than 5.

### 14.2 Fable 5.1 — 90.00 / 100 — Grade A, Rank 2

**Weighted fingerprint.**

| Dimension | Raw /5 | Weighted |
|---|---:|---:|
| Finding validity | 4 | 12.00 |
| Important-issue coverage | 4 | 12.00 |
| Evidence quality | 5 | 10.00 |
| Severity calibration | 4 | 5.60 |
| Confidence / epistemic discipline | 5 | 7.00 |
| Security / trust-boundary reasoning | 5 | 8.00 |
| Logic / state / concurrency | 4 | 6.40 |
| Architecture / root-cause reasoning | 5 | 8.00 |
| Test-quality reasoning | 5 | 6.00 |
| Scope discipline / signal-to-noise | 4 | 4.00 |
| Operational usefulness | 5 | 6.00 |
| Independent reviewer judgment | 5 | 5.00 |
| **Total** | | **90.00** |

**Strongest dimensions (REFEREE JUDGMENT).** Evidence quality, epistemic discipline, security and trust-boundary reasoning, architecture, test-quality reasoning, operational usefulness, independent judgment. Sol described the end-to-end explanation of how anonymous order creation and status mutation, caller-controlled charges, fabricated negative fees, and missing payment reconciliation reinforce each other as its strongest work.

**Important valid findings.** The five critical findings mapping to the order-mutation, caller-controlled-amount, caller-controlled-discount, dual-intent, reconciliation, and thank-you families; the unauthenticated registration personal-data oracle; credential logging; divergent shipping sources of truth; and an unusually actionable account of redirect and thank-you behavior.

**Unique valid findings.** Checkout defaulting registration on, with an existing customer recordable as a new signup; and separately identified caller-controlled Stripe customer and receipt-email behavior.

**Important misses.** Zero-priced complex variations, both category pagination defects, the live percentage-coupon eligibility arithmetic, and the exact missing-slug process-exit trigger.

**False or partial claims.** The process-exit finding was PARTIAL: the dangerous `process.exit(1)` was found, but the report stated that not-found slugs return null without triggering it, when `notFound()` throws inside the very `try` whose broad catch calls the exit. The coupon-enumeration finding was PARTIAL for treating an upstream-dependent result as high-confidence. Custom-domain CORS failure, live and test key pairing, layout-export build failure, and the stock consequence were correctly conditional and therefore NOT ADJUDICABLE as deployed failures.

**Referee characterization.** Exceptional breadth; strong financial and security root-cause synthesis; precise evidence; excellent test critique; clear sequencing of repairs; disciplined conditional labels. Weaknesses are the missed ordinary-user state defects, the misread process-exit trigger, and a long tail of conditional deployment and low-priority hygiene items. Sol explicitly identified Fable against the 90-point boundary as one of the two closest scoring judgments in the benchmark.

### 14.3 GLM 5.3 — 85.00 / 100 — Grade B, Rank 3

**Weighted fingerprint.**

| Dimension | Raw /5 | Weighted |
|---|---:|---:|
| Finding validity | 4 | 12.00 |
| Important-issue coverage | 4 | 12.00 |
| Evidence quality | 5 | 10.00 |
| Severity calibration | 3 | 4.20 |
| Confidence / epistemic discipline | 4 | 5.60 |
| Security / trust-boundary reasoning | 5 | 8.00 |
| Logic / state / concurrency | 4 | 6.40 |
| Architecture / root-cause reasoning | 5 | 8.00 |
| Test-quality reasoning | 4 | 4.80 |
| Scope discipline / signal-to-noise | 4 | 4.00 |
| Operational usefulness | 5 | 6.00 |
| Independent reviewer judgment | 4 | 4.00 |
| **Total** | | **85.00** |

**Strongest dimensions (REFEREE JUDGMENT).** Evidence quality, security and trust-boundary reasoning, architecture and root-cause reasoning, operational usefulness. Sol found its evidence for caller-controlled amounts, negative fees and shipping, arbitrary status mutation, the missing webhook, and stale client-secret reuse precise and reproducible, and credited it with correctly centering the server's failure to own the financial transaction.

**Important valid findings.** All five critical money-path findings on source behavior; the registration personal-data oracle; raw coupon disclosure; coupon lifecycle and revalidation defects; shipping divergence; the active shared limiter and undeclared dependency; CMS and public-route families; and a strong test critique covering false-positive route tests, missing payment coverage, fixtures, and deployment gates.

**Unique valid findings.** Sol recorded no fully unique major family. Its gift-card rendering gap was judged useful but belonging to the lower-priority dead and public-route family.

**Important misses.** Zero-priced complex variations, both pagination defects, the live percentage-coupon eligibility error, persisted and dealer coupon revalidation, the exact missing-slug termination path, and the concrete Sharp and Node dependency contract.

**False or partial claims.** Three PARTIAL classifications. The process-exit trigger was tied to fetch failure while overlooking the caught `notFound()`. The unwired environment variable was correctly identified for four routes, but the conclusion that the live blog data path is broken is wrong, because the blog pages use a different service and endpoint. The claim that build-argument secrets are recoverable by any reader of the final multi-stage image is not established by this source; the secrets do enter the builder environment, but the final runner stage is clean. A cart-key mismatch was real but rated High on a production path that is unused.

**Referee characterization.** Strong end-to-end money-path analysis, precise citations, useful remediation plan, good coverage of coupon and shipping drift, dependency hygiene, and deployment gates. Weaknesses are severity inflation for a latent cart path and dead routes, the two overstated operational conclusions, and the missed variation and pagination state failures. Sol named GLM 5.3's severity and confidence ratings as the other closest scoring judgment in the set.

### 14.4 GLM 5.3 Flash — 71.20 / 100 — Grade C, Rank 4

**Weighted fingerprint.**

| Dimension | Raw /5 | Weighted |
|---|---:|---:|
| Finding validity | 3 | 9.00 |
| Important-issue coverage | 3 | 9.00 |
| Evidence quality | 4 | 8.00 |
| Severity calibration | 3 | 4.20 |
| Confidence / epistemic discipline | 3 | 4.20 |
| Security / trust-boundary reasoning | 4 | 6.40 |
| Logic / state / concurrency | 3 | 4.80 |
| Architecture / root-cause reasoning | 5 | 8.00 |
| Test-quality reasoning | 4 | 4.80 |
| Scope discipline / signal-to-noise | 4 | 4.00 |
| Operational usefulness | 4 | 4.80 |
| Independent reviewer judgment | 4 | 4.00 |
| **Total** | | **71.20** |

**Strongest dimensions (REFEREE JUDGMENT).** Architecture and root-cause reasoning, at the same raw 5 as every other contestant. Sol called its root-cause summary of browser as ledger, browser-driven order lifecycle, duplicated configuration, and insecure observability strong and concise.

**Important valid findings.** The main financial architecture: unauthenticated order mutation, caller-controlled amount, caller-controlled discount authority, the dual-intent and reconciliation failures, the thank-you page, the registration oracle, credential logging, coupon and shipping divergence, and client-side persistence. It also correctly treated the exact Stripe runtime outcome as conditional and correctly labeled the cart-key path latent.

**Unique valid findings.** No materially useful unique valid major finding. Sol credited its unescaped embedded JSON observation as a useful low-priority unique detail within the CMS trust family.

**Important misses.** Raw public coupon and usage-data disclosure, the process-termination path, zero-priced complex variations, both pagination failures, the unwired endpoints and build-time host family, and the precise Sharp and Node contract. Sol singled out the unauthenticated coupon data exposure and the remotely reachable process termination as particularly meaningful omissions.

**False or partial claims.** One material INVALID: the claim that the shared WooCommerce limiter is dead code, when `productServices.ts` calls the imported alias at lines 172, 400, 677, and 920. The same shared single-slot limiter therefore does serialize those operations, the opposite of the report's conclusion. Repeating "unused" in the lower notes was classified DUPLICATE rather than a second finding. The deployment finding was PARTIAL: the Node version, one-instance cap, committed test-mode public key, and builder-stage secret injection are source facts, but final-image recoverability is not established, and the asserted Stripe SDK generation mismatch and React and Next compatibility concern are unsupported speculation on this record.

**Referee characterization.** Concise architectural diagnosis, strong core checkout and security analysis, good latent cart and test-contract insight, clear repair priorities. Weaknesses are the false limiter claim, several unsupported deployment and version assertions, and multiple high-value availability, privacy, pricing, and pagination misses. Sol stated explicitly that the limiter error weakened validity, logic and concurrency reasoning, and confidence calibration together, which is visible in the matrix as three simultaneous drops to raw 3.

---

## 15. Technical Issue Families

Summary of Sol's consolidated families. These describe the specimen, not any contestant. Classifications are REFEREE JUDGMENT against the frozen source.

**Payment and order authority (F-001, F-003).** An unauthenticated route performs a privileged WooCommerce order update from caller-controlled order ID and status and returns the resulting order. Order transformation trusts submitted coupon metadata, discount total, shipping method, and shipping cost, so a fabricated custom coupon can become a caller-selected negative fee. All four contestants found both.

**Stripe amount binding (F-002).** The payment-intent route forwards caller-controlled amount, currency, and order association without loading or reconciling the WooCommerce order. All four found it.

**Client-controlled monetary state (F-003, F-014, F-015, F-018).** Coupon authority, shipping selection, and discount arithmetic are decided client-side. Coupon math diverges across implementations, including a live native percentage calculation that discounts the entire subtotal after a single eligible match, and a dead, incorrect fixed-product formula. Shipping has divergent sources of truth and can discard configured or free-shipping choices. Billing, shipping, and order data persist client-side without a complete lifecycle.

**Payment reconciliation and webhooks (F-004, F-005, F-006, F-007).** Checkout mounts Stripe Elements against a persisted hardcoded 52-cent payment intent and creates a second intent at submission. The only paid-order transition supplied is a browser callback. No signed webhook or server reconciliation route exists. The thank-you page clears state and announces success without checking payment. Retry and replay lack idempotency, and abandoned pending orders accumulate. The exact Stripe SDK response to the mismatched setup is external and was held NOT ADJUDICABLE, while the dual-intent lifecycle and stale-secret persistence are proven.

**Personal-data exposure (F-008, F-009, F-018, F-028).** An unauthenticated registration route returns a full existing customer record for a submitted email. The public coupon route returns the raw upstream response including usage and restriction data and interpolates the code into an authenticated upstream URL. Product reads may expose unpublished products, held NOT ADJUDICABLE as a deployed effect.

**Credential logging (F-010).** Multiple routes log WooCommerce credentials or credential-bearing URLs, and order transformation logs the complete transformed order including customer data. Query-string authentication widens the exposure. All four found it.

**Process termination (F-011).** The product page catches Next's thrown `notFound()` control flow and calls `process.exit(1)`, so any nonexistent dynamic slug can terminate the process on a single-instance service. Only Astra identified the exact trigger; Fable 5.1 and GLM 5.3 found the exit but misattributed its reachability; GLM 5.3 Flash missed it.

**Complex variation zero-price path (F-012).** Complex variation selection changes displayed price and variation ID but never sets the cart item's base price, and the product details path then prefers the still-numeric zero, producing a zero-priced cart line on an ordinary shopping path. Astra alone found it.

**Category pagination races (F-017).** The client fetch is unfiltered, direct page loads seed under page one, and late responses can write into a new category's namespace. Astra alone found both defects.

**Coupon and shipping divergence (F-013, F-014, F-015).** Coupon lifecycle validation is not re-applied to persisted or dealer coupons, parsed expiry time is ignored, arithmetic diverges across implementations, and shipping sources of truth conflict.

**Deployment and runtime issues (F-020, F-021, F-022).** A build-time absolute application URL and missing WordPress API environment wiring leave four routes unwired. A shared single-slot limiter serializes product-service calls while its dependency is undeclared, and the sitemap performs a broad uncached walk. The container runs Node 18 while the locked Sharp version and its platform packages require Node 20.9 or newer. Several deployment consequences, including key mode and custom-domain behavior, remained conditional.

**Trust boundary and route hygiene (F-019, F-023, F-024, F-029, F-030, F-031).** Weak route schemas, raw unbounded upstream parameters, inconsistent error mapping, absent throttling, CMS-controlled script and HTML injection, missing headers, unsafe JSON script serialization, public placeholder and dead routes, caller-influenced Stripe customer and receipt behavior, and no application-side stock check. Several were bounded as conditional or NOT ADJUDICABLE.

**Test-fidelity weaknesses (F-026).** Tests and the deployment gate give false confidence in checkout and security. End-to-end tests require absent live fixtures, and referenced assurance documents are missing from the tree. All four contestants engaged with this family, and Sol judged all four instances valid.

---

## 16. Operational Usage Evidence

Provider meters are kept separate by provider and are never converted into tokens, dollars, or normalized compute. Percentages are provider-native meter movements only.

### 16.1 Astra — provider-specific card

| Measurement | Value | Evidence |
|---|---|---|
| Weekly meter before | 99% left | OPERATOR OBSERVATION, screenshot, recorded in `MODEL_MANIFEST.md` |
| Weekly meter after | 97% left | OPERATOR OBSERVATION, screenshot |
| Observed weekly delta | approximately 2 percentage points consumed | OPERATOR OBSERVATION |
| 5-hour meter | 100% left before and after, no visible movement | OPERATOR OBSERVATION |
| Context after run | 185K / 258K used | OPERATOR OBSERVATION |
| Requests | NOT RECORDED | — |
| Self-reported review interval | 10 minutes 35 seconds from first recorded clock reading to completion, excluding unrecorded startup | Contestant self-reported |

### 16.2 Fable 5.1 — provider-specific card

| Measurement | Value | Evidence |
|---|---|---|
| 5-hour window consumed | approximately 8% of the Claude 5-hour Max-20x window | **OPERATOR-OBSERVED / EVIDENCE PENDING.** The run notes record provider usage before and after as UNKNOWN / NOT RECORDED. |
| Requests | NOT RECORDED | Run notes record request and tool-call count as UNKNOWN / NOT RECORDED |
| Self-reported runtime | approximately 12 minutes | Contestant self-reported |

### 16.3 GLM provider pair — the only direct meter comparison

Both GLM contestants ran on the same provider and the same meter, so this is the only comparison in CR-BENCH-02 where meter movement can be read across models.

| Measurement | GLM 5.3 | GLM 5.3 Flash | Evidence |
|---|---|---|---|
| Score | 85.00 | 71.20 | FACT, frozen |
| Provider session meter delta | approximately +13.5 percentage points | approximately +8 percentage points | **OPERATOR-OBSERVED / EVIDENCE PENDING** for both. Run notes record provider usage as UNKNOWN / NOT RECORDED. |
| Requests | 248 | 179 | **OPERATOR-OBSERVED / EVIDENCE PENDING** for both. Run notes record request counts as UNKNOWN / NOT RECORDED. |
| Interruptions | one context compaction | none reported | FACT |
| Self-reported runtime | NOT RECORDED | approximately 40 minutes | Contestant self-reported |

**Custodian integrity note (FACT).** Only Astra's operational figures are backed by a recorded repository artifact. The Fable and GLM figures in this section were supplied by the operator at compilation time and are contradicted by the run notes, which state UNKNOWN / NOT RECORDED for exactly these fields. They are therefore marked operator-observed with evidence pending rather than presented as measurements. `reports/OPERATIONAL_USAGE.md` remains unpopulated, so no repository artifact yet corroborates them. If the provider screenshots or session exports are preserved, attaching them to that file would convert these to FACT.

**Comparability warning.** Astra, Fable 5.1, and the GLM pair report on three different providers using different meter definitions, different windows, and different denominators. Cross-provider percentage comparison is not meaningful and is not performed here.

---

## 17. Quality versus Operational Burden

Descriptive only. No normalized cost ratio, tokens-per-point, or dollar figure is computed, because the evidence does not support one.

**Technical quality.** The frozen spread runs from 95.60 to 71.20, a 24.4-point range. The top three are separated by 10.6 points and sit in the A and B bands; the fourth is 13.8 points below third place.

**Requests where available.** Within the GLM pair, the higher-scoring model is reported at roughly 39% more requests than the faster variant, for a 13.8-point quality advantage. Both request counts are operator-observed with evidence pending. No request count exists for Fable or Astra, so no request-based comparison spans the full field.

**Provider-native meter movement.** Within the GLM pair only, the higher-scoring model shows the larger session-meter movement, roughly +13.5 against +8 percentage points, both evidence pending. Astra's separately metered run consumed about 2 weekly percentage points with no visible 5-hour movement, and Fable's approximately 8% of a 5-hour window is evidence pending. These belong to three different meters and cannot be ranked against each other.

**Interruptions.** One context compaction during the GLM 5.3 run, resumed on the same review. No interruptions or quota events in the other three runs. No run failed, and no run required a restart.

**Operational practicality (INFERENCE, clearly marked).** On this single specimen, the two highest scores came from runs with no interruptions and, where measured, modest meter movement. Within the one directly comparable pair, the more expensive run bought a materially better review. Nothing here establishes a general price-performance curve, and the cross-provider figures cannot be combined into one.

---

## 18. What Round Two Changes From Round One

CR-BENCH-01 evidence is drawn from the round-one repository report and artifacts.

| Aspect | CR-BENCH-01 | CR-BENCH-02 |
|---|---|---|
| Specimen | `stark-ai-workbench-nextjs-frontend-v1` at commit `466083f2b415d9faeb362eb5e48f6e259a42d840` | DockBloxx production storefront at `059ccdba…`, 362 files, live commerce, payments, coupons, deployment |
| Field | Six models: GLM 5.3, GLM 5.3 Flash, DeepSeek V4 Pro, DeepSeek V4 Flash, MiniMax 3, Kimi K2.7 Code | Four premium models: Astra, Fable 5.1, GLM 5.3, GLM 5.3 Flash |
| Referee | GPT-6 Astra, High reasoning | Sol, High reasoning, with Astra moved into the contest |
| Top score | 76.0, grade B | 95.60, grade A |
| Score range | 76.0 down to 40.8 | 95.60 down to 71.20 |
| Adjudication | Referee result accepted without score modification | Jarvis accepted Sol's scores as written, blind |

**Stronger production specimen (FACT).** Round two used a live commerce application whose failure modes carry direct financial consequence, rather than a workbench front end.

**Premium field (FACT).** Round two dropped the mid and lower tier entirely. Its lowest score, 71.20, is materially above round one's winning score of 76.0 only in the sense that both sit near the B and C boundary; the comparison across different specimens and different referees is not a like-for-like measurement and no equivalence is claimed.

**Physically isolated referee workspace (FACT).** Round two built the referee workspace outside the benchmark repository, containing only the target, the manifest, the scorecard, both prompts, and the four blind reports, with no Git directory, no mapping, and no identities or economics.

**Referee source access (FACT).** Sol scored with read-only access to the frozen target and verified contested claims against the source, rather than judging reports on internal plausibility alone. That access is what produced the adjudicated INVALID and PARTIAL classifications that drove the final ordering.

**Dimension scorecards (FACT).** Round two required a full 12-dimension scorecard per reviewer with a written rationale for every row, and Jarvis verified each weighted calculation.

**Substantially higher top score (FACT, with a caution).** The top score rose from 76.0 to 95.60. Different specimen, different referee, different field. **No statistical significance is claimed, and no trend across rounds is asserted.**

---

## 19. Factory Role Implications

**Supported by CR-BENCH-02.**

- On this specimen, Astra produced the highest-validity review with the strongest unique correctness discoveries, and was the only contestant to find the zero-price variation path, both pagination defects, and the exact process-termination trigger.
- On this specimen, Fable 5.1 produced the broadest coverage of the security and financial trust boundary with disciplined conditional labeling, at grade A.
- On this specimen, GLM 5.3 produced a strong, actionable core money-path review at grade B, with severity inflation on latent paths and two overstated operational conclusions.
- On this specimen, GLM 5.3 Flash produced a sound architectural diagnosis but a materially weaker verified review, with one false claim about live code and several high-value misses.
- All four models identified the central browser-as-ledger failure. Architectural diagnosis did not discriminate between them.
- Access to the source during refereeing changed outcomes: the fourth-place ordering was driven by a claim that was falsifiable only by checking four call sites.

**Hypothesis for future factory use.** Each item below is a hypothesis, not a finding.

- A two-pass arrangement, with one model for breadth and another for deep verification, might outperform any single reviewer, since the top two models missed different families.
- Models that scored high on epistemic discipline may be better suited to work where an unverified claim is expensive, such as production incident triage.
- Faster or cheaper variants may be adequate for routine tactical passes where a human verifies before action, given that the lowest scorer still reached raw 5 on architecture.
- Requiring reviewers to state which claims they verified, and how, may improve validity scores generally.

These hypotheses would need multiple specimens, repeated runs, and consistent operational measurement before they could inform standing policy. One benchmark on one repository is not doctrine.

---

## 20. Benchmark Integrity

All FACT.

**Target provenance.** Certified against the pinned upstream commit by two independent methods, with the failed first attempt preserved in the ledger rather than overwritten.

**Frozen manifest.** 362 entries, C-locale sorted, repository-relative paths, no duplicates, manifest file SHA-256 `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea`. Verified 362/362 OK at specimen freeze, after each of the four runs, at blind packaging, at workspace build, and at report compilation.

**Contestant isolation.** Fresh sessions, identical frozen prompt, no rubric, no expected findings, no cross-contestant visibility, no coaching after the prompt.

**Raw-report hashes.** Each raw report was hashed at closeout and re-verified at every later stage. All four still match.

**Blind hashes.** Each blind artifact was hashed at packaging and re-verified when the referee workspace was built.

**Sealed random mapping.** Drawn once from an operating-system random seed, recorded only in the sealed mapping file, never present in the referee workspace, and opened only after scoring and adjudication were frozen.

**Blind referee.** Sol received no identities, no economics, no run notes, no run order, no model manifest, no ledger, and no benchmark brief.

**Blind Jarvis audit.** Jarvis adjudicated while the mapping was still sealed and accepted the scores without changes.

**Reveal only after scoring freeze.** Both the referee report and the adjudication were complete and frozen before Tony authorized reveal.

**Operational evidence withheld until after adjudication.** Usage measurements were recorded in run notes and the model manifest, withheld from Sol and Jarvis under rule R11, and reconnected only in this report.

**Open integrity items (FACT, disclosed rather than resolved).**

1. `referee/SOL_REFEREE_REPORT.md` in the benchmark repository is still the scaffold placeholder. Sol's actual 249-line report exists only in the isolated referee workspace, at SHA-256 `a76f48a59483916a0fc16c32bcb8f9327a666d07832e567990696f49e766315c`. This report was compiled from that file. The referee output should be ingested into the repository and hashed into the ledger.
2. `referee/SOL_REFEREE_RUN_NOTES.md` was never populated, so the referee run has no run-notes record.
3. `MODEL_MANIFEST.md` still reads TBD for three of four contestants, though their identifiers are recorded elsewhere.
4. `reports/OPERATIONAL_USAGE.md`, `reports/FINAL_SCORECARD.md`, `reports/DIMENSION_COMPARISON.md`, and `reports/MODEL_ROLE_RECOMMENDATIONS.md` remain scaffold placeholders.
5. All four contestant runs executed in the benchmark repository root rather than isolated workspace copies, which is what made the Run 1 and Run 3 history-inspection notes possible.

---

## 21. Limitations

- **Single repository.** One specimen, one technology stack, one domain. Nothing here generalizes to other codebases without further evidence.
- **One run per model.** No repetition, so run-to-run variance is unmeasured. A single re-run could plausibly move any score.
- **Heterogeneous provider meters.** Three different providers with different meter definitions and windows. Only the GLM pair is directly comparable, and even those figures are evidence pending.
- **Fable prior exposure.** The operator records that Fable had earlier exposure to a previous DockBloxx review. The frozen rules excluded any previous Fable review from the contestant materials, but prior familiarity cannot be excluded by protocol and is disclosed here as a potential advantage of unknown size.
- **Astra controlled-execution depth.** Astra used in-memory execution of extracted source with fakes, while the other three used static inspection only. This was accepted as natural reviewer behavior, but it is a real asymmetry in evidence-gathering method, and Astra's highest-rated dimensions are validity and evidence quality.
- **No full runtime, build, or external-service execution.** No contestant and not the referee installed dependencies, built the application, ran the test suite, or contacted a live service.
- **External behaviors sometimes unadjudicable.** Stripe SDK behavior for the mismatched Elements setup, live WooCommerce configuration and coupon parsing, Secret Manager key mode, custom-domain mapping, enabled WordPress plugins, and build-cache access could not be settled from the frozen source. Those remained conditional even where the source-side precondition was proven.
- **Referee and adjudicator are themselves models.** Sol's classifications and Jarvis's audit are judgments, not ground truth, though both were made against the frozen source and are reproducible from the record.
- **No statistical significance.** No confidence interval, significance test, or cross-round trend is claimed. The score gaps are single-observation differences.

---

## 22. Final Conclusions

**What this experiment supports.**

- Under identical, uncoached conditions on this frozen production specimen, Astra produced the strongest review at 95.60, ahead of Fable 5.1 at 90.00, GLM 5.3 at 85.00, and GLM 5.3 Flash at 71.20. Those scores were assigned blind and upheld without change by a blind adjudicator.
- All four models diagnosed the specimen's central architectural failure correctly. Architecture was not the discriminator; validity, verification discipline, and ordinary-user correctness coverage were.
- A review's worst enemy in this instrument was a confident false claim. The only material INVALID classification in the field cost its author across three dimensions simultaneously.
- Referee access to the frozen source materially changed the outcome, because several disputed claims could be settled only by reading the code.
- The benchmark's integrity controls held: the target was never modified, all hashes verified at every stage, the mapping stayed sealed through adjudication, and one genuine provenance failure was caught, reported, and resolved rather than papered over.

**What this experiment does not support.**

- It does not establish a general capability ranking of these models. It measures one review of one repository, once.
- It does not support cost or efficiency claims. Three of the four operational figures in this report are operator-observed with evidence pending, and cross-provider meters are not comparable.
- It does not support a claim that Astra's margin over Fable 5.1 is reliable. The gap is 5.60 points on a single observation, the two share a frozen grade band, and Sol named Fable's position against the 90-point boundary as one of its closest judgments.
- It does not establish that the specimen's conditional findings are real production failures. Many depend on external systems that were deliberately never contacted.
- It does not license standing factory policy. The role implications in section 19 are split deliberately between what this run supports and what remains hypothesis.

---

## Appendix A — Canonical Final Scorecard

| Rank | Contestant | Blind slot | Score / 100 | Frozen grade | Presentation label |
|---:|---|---|---:|:---:|:---:|
| 1 | Astra | REVIEWER_C | 95.60 | A | A+ |
| 2 | Fable 5.1 | REVIEWER_A | 90.00 | A | A |
| 3 | GLM 5.3 | REVIEWER_B | 85.00 | B | B |
| 4 | GLM 5.3 Flash | REVIEWER_D | 71.20 | C | C |

Grade bands: A 90.00–100.00, B 80.00–89.99, C 70.00–79.99, D 60.00–69.99, F below 60.00. The A+ label is presentation only and has no band in the frozen instrument. Scores are Sol's, upheld unchanged by Jarvis.

## Appendix B — 12-Dimension Matrix

Raw 0–5 ratings with weighted points in parentheses.

| Dimension | Weight | Astra | Fable 5.1 | GLM 5.3 | GLM 5.3 Flash |
|---|---:|---|---|---|---|
| Finding validity | 15 | 5 (15.00) | 4 (12.00) | 4 (12.00) | 3 (9.00) |
| Important-issue coverage | 15 | 4 (12.00) | 4 (12.00) | 4 (12.00) | 3 (9.00) |
| Evidence quality | 10 | 5 (10.00) | 5 (10.00) | 5 (10.00) | 4 (8.00) |
| Severity calibration | 7 | 4 (5.60) | 4 (5.60) | 3 (4.20) | 3 (4.20) |
| Confidence / epistemic discipline | 7 | 5 (7.00) | 5 (7.00) | 4 (5.60) | 3 (4.20) |
| Security / trust-boundary reasoning | 8 | 5 (8.00) | 5 (8.00) | 5 (8.00) | 4 (6.40) |
| Logic / state / concurrency | 8 | 5 (8.00) | 4 (6.40) | 4 (6.40) | 3 (4.80) |
| Architecture / root-cause reasoning | 8 | 5 (8.00) | 5 (8.00) | 5 (8.00) | 5 (8.00) |
| Test-quality reasoning | 6 | 5 (6.00) | 5 (6.00) | 4 (4.80) | 4 (4.80) |
| Scope discipline / signal-to-noise | 5 | 5 (5.00) | 4 (4.00) | 4 (4.00) | 4 (4.00) |
| Operational usefulness | 6 | 5 (6.00) | 5 (6.00) | 5 (6.00) | 4 (4.80) |
| Independent reviewer judgment | 5 | 5 (5.00) | 5 (5.00) | 4 (4.00) | 4 (4.00) |
| **Total** | **100** | **95.60** | **90.00** | **85.00** | **71.20** |

## Appendix C — Frozen Artifact Hashes

**Specimen**

| Artifact | SHA-256 |
|---|---|
| Pinned source commit | `059ccdba8174cf9c11628002387a9676b1785287` |
| Commit tree object | `4879d4712e223a816ff621dd29bcd04c2f66ca51` |
| `TARGET_MANIFEST.sha256` (362 entries) | `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea` |

**Instrument, frozen 2026-09-15**

| Artifact | SHA-256 |
|---|---|
| `BENCHMARK_BRIEF.md` | `a14a36fd4a17c3b60048c744f0ee5d3e20fc7979168d79bf749752a377586f30` |
| `BENCHMARK_RULES.md` | `7cd16c7459bfd0e228d3ea8bbbbc1700d39f03345bc4dfbe59ae09443422ef99` |
| `RUN_ORDER.md` | `d5aee83c9fbfb7bd0b8d98a7fe2ae1971c4bb65c8fc86e01404a61cbe337fb1a` |
| `EVAL_SCORECARD.md` | `3931f16aaedfedf527b8b910971d8a60394c81f10a20036d82bbc0f3043ab177` |
| `templates/CONTESTANT_PROMPT.md` | `6f09dd6d4fb619d59865702b2d69fe3190d98f50e843d1159c9afac21f474a95` |
| `templates/RUN_NOTES_TEMPLATE.md` | `b60bb35dbaf6f1bb45df556ce1f3857f56e95d9f0a150114b211db377de6991b` |
| `templates/CONTESTANT_CLOSEOUT_TEMPLATE.md` | `08a34ead6e6e63dfea13fbbce813bc4d301cbc60e7185806aefaee73b06c947f` |
| `templates/REFEREE_PROMPT.md` | `caaef47ab98652260e4d3ea26213e11ddea54c245f053e92a32c69ae72eccc87` |

**Frozen raw contestant reports**

| Contestant | SHA-256 |
|---|---|
| Fable 5.1 | `5c37091b7ff9e2d2691b33dac41f3fd6821ae76370c1deda90031fd7423b670d` |
| GLM 5.3 Flash | `3175b4ae58ed91e94938c5e9e5079e83fdb2efeb7fc12b15bf9171828637c23c` |
| GLM 5.3 | `8a8e5efeb30e5091e2fdb0d2c43566c47f1627b3b8e3f2c9ddcbabdabc91c92f` |
| Astra | `20b5e335013010f7c1866dc4b83c167767dfae81eff82939a6bcb60e32fbceb5` |

**Blind artifacts**

| Artifact | SHA-256 |
|---|---|
| `referee/blind/REVIEWER_A.md` | `9f80246eaec84652fa792cba7a39e2975a70244a08eff54f2836fd0843bf8abe` |
| `referee/blind/REVIEWER_B.md` | `4e3f95321034a4ab7050402bcbf951238a98d24bc15fd3987faeb7d60d4a5da8` |
| `referee/blind/REVIEWER_C.md` | `00acc492ab31fb07c02df80f34f87dd2c617dcca247192440161b69b3499b554` |
| `referee/blind/REVIEWER_D.md` | `585be90059dd4c5fffae53db29d6bb6f8e45ecb883acd3393fffe9a35badbcd9` |

**Referee output**

| Artifact | SHA-256 |
|---|---|
| Sol referee report, workspace copy, 249 lines | `a76f48a59483916a0fc16c32bcb8f9327a666d07832e567990696f49e766315c` |

Not yet ingested into the benchmark repository; see section 20, open item 1.

## Appendix D — Operational Evidence Ledger

| Contestant | Provider meter | Movement | Requests | Interruptions | Evidence class |
|---|---|---|---|---|---|
| Astra | weekly and 5-hour | weekly 99% → 97% left, about 2 points consumed; 5-hour 100% → 100%, no visible movement; context 185K / 258K after run | NOT RECORDED | none | OPERATOR OBSERVATION, recorded in `MODEL_MANIFEST.md` |
| Fable 5.1 | Claude 5-hour Max-20x window | approximately 8% of the window | NOT RECORDED | none | OPERATOR-OBSERVED / EVIDENCE PENDING; run notes say UNKNOWN |
| GLM 5.3 | GLM provider session meter | approximately +13.5 percentage points | 248 | one context compaction | OPERATOR-OBSERVED / EVIDENCE PENDING; run notes say UNKNOWN |
| GLM 5.3 Flash | GLM provider session meter | approximately +8 percentage points | 179 | none | OPERATOR-OBSERVED / EVIDENCE PENDING; run notes say UNKNOWN |

Only the GLM pair shares a meter and is directly comparable. Percentages are provider-native meter movements and are never converted into tokens, dollars, or normalized compute.

## Appendix E — Blind Mapping / Reveal Record

| Blind slot | Contestant | Raw report SHA-256 | Blind artifact SHA-256 |
|---|---|---|---|
| REVIEWER_A | Fable 5.1 | `5c37091b…3b670d` | `9f80246e…3bf8abe` |
| REVIEWER_B | GLM 5.3 | `8a8e5efe…c91c92f` | `4e3f9532…0d4a5da8` |
| REVIEWER_C | Astra | `20b5e335…2fbceb5` | `00acc492…3499b554` |
| REVIEWER_D | GLM 5.3 Flash | `3175b4ae…8637c23c` | `585be900…5badbcd9` |

**Method.** A 32-byte seed was drawn from the operating-system random source. Contestant slugs sorted in C locale were ordered by the SHA-256 of seed and slug, ascending, and assigned to the four slots in that order. The draw was computed once with no re-draws, and the seed is recorded in the sealed mapping file.

**Redactions applied when producing the blind copies**, four in total, one per report: a title naming a contestant; a header carrying a contestant name and exact model identifier; a header naming a contestant, whose run-position reference was also removed as identity-linked; and a closing line quoting contestant folder paths. Each was replaced with an identity-redaction marker. Line counts were preserved exactly, and no finding, severity, evidence, wording, ordering, line reference, recommendation, or limitation was altered. A case-insensitive leak scan over the blind copies returned only genuine technical content.

**Seal and reveal.** The mapping was sealed on 2026-09-16, remained outside the referee workspace throughout, and was opened only after both the Sol report and the Jarvis adjudication were frozen, on Tony Stark's authority.

---

*End of canonical report. Frozen scores, raw contestant reports, the Sol referee report, and the Jarvis adjudication were not modified during compilation.*
