# CR-BENCH-02 — Evaluation Scorecard

**Status:** FROZEN — 2026-09-15

**Visibility:** Withheld from all contestants. Provided to Sol and Jarvis.

This instrument preserves the CR-BENCH 100-point dimensional evaluation architecture.

## Dimensions

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

## Dimension definitions

1. **Finding validity:** reported findings are real when checked against the frozen target. Penalize invalid, fabricated, or misread findings.
2. **Important-issue coverage:** the review finds the materially important issues present in the target, as established by the referee's consolidated verified finding set and significant misses.
3. **Evidence quality:** findings cite precise files, lines, code paths, and reproducible reasoning that a maintainer can check.
4. **Severity calibration:** priority and severity match real impact. Neither inflated nor understated.
5. **Confidence / epistemic discipline:** proven findings are separated from conditional concerns. Stated confidence matches evidence. Unverified assumptions are labeled.
6. **Security / trust-boundary reasoning:** quality of reasoning about authentication, authorization, input trust, secrets, payment and data integrity, and client/server boundaries.
7. **Logic / state / concurrency:** quality of reasoning about correctness, state transitions, races, idempotency, caching, and failure paths.
8. **Architecture / root-cause reasoning:** identifies underlying design causes and systemic patterns rather than only symptoms.
9. **Test-quality reasoning:** assesses whether tests and verification actually protect important behavior, including false confidence.
10. **Scope discipline / signal-to-noise:** material findings dominate. Style nits, filler, and speculative padding are minimal.
11. **Operational usefulness:** a maintainer could act on the review: clear prioritization, actionable remediation direction, deploy and runtime relevance.
12. **Independent reviewer judgment:** evidence of senior/principal judgment beyond generic checklists. Well-chosen investigation, sound trade-off calls, and non-obvious insight.

## Raw capability rating (0–5)

Each dimension receives one integer raw rating.

| Rating | Meaning |
|---:|---|
| 0 | Absent or wholly incorrect |
| 1 | Very weak. Mostly invalid, missing, or unsupported |
| 2 | Weak. Some value, significant gaps or errors |
| 3 | Competent. Solid, with notable gaps |
| 4 | Strong. Minor gaps only |
| 5 | Exceptional. Principal-level, no material gaps |

## Weighted score

For each dimension:

```
weighted score = (raw rating / 5) × dimension weight
```

Total = sum of the 12 weighted scores, maximum 100. Weighted scores are reported to two decimal places.

## Required per reviewer

Sol produces a complete 12-dimension scorecard for each of REVIEWER_A, REVIEWER_B, REVIEWER_C, and REVIEWER_D. Each dimension row contains the raw rating, the weighted score, and a short scoring rationale. No dimension may be left blank.

| Dimension | Weight | Raw (0–5) | Weighted | Rationale |
|---|---:|---:|---:|---|
| Finding validity | 15 | | | |
| Important-issue coverage | 15 | | | |
| Evidence quality | 10 | | | |
| Severity calibration | 7 | | | |
| Confidence / epistemic discipline | 7 | | | |
| Security / trust-boundary reasoning | 8 | | | |
| Logic / state / concurrency | 8 | | | |
| Architecture / root-cause reasoning | 8 | | | |
| Test-quality reasoning | 6 | | | |
| Scope discipline / signal-to-noise | 5 | | | |
| Operational usefulness | 6 | | | |
| Independent reviewer judgment | 5 | | | |
| **Total** | **100** | | | |

## Grades and rank

| Weighted total | Grade |
|---|---|
| 90.00–100.00 | A |
| 80.00–89.99 | B |
| 70.00–79.99 | C |
| 60.00–69.99 | D |
| below 60.00 | F |

Rank is by weighted total, descending. Equal totals are reported as a tie. They are not broken artificially.

## Official result

The official technical result is the Jarvis-adjudicated scorecard (see `BENCHMARK_RULES.md` R14).
