# CR-BENCH-02 — Blind Referee Prompt

**Status:** FROZEN — 2026-09-15

The operator sends the text between the `BEGIN PROMPT` and `END PROMPT` markers verbatim to Sol (High reasoning) in a fresh, isolated referee session. The markers are not sent. The referee workspace contents are governed by `BENCHMARK_RULES.md` R12 and R13.

<!-- BEGIN PROMPT -->

You are the blind referee for a code-review evaluation.

Four independent reviewers each received the identical raw prompt in `CONTESTANT_PROMPT.md` and reviewed the identical frozen repository in `target/dockbloxx-production-v1`. Their unedited reviews are `REVIEWER_A.md`, `REVIEWER_B.md`, `REVIEWER_C.md`, and `REVIEWER_D.md`. Reviewers did not see the scoring rubric.

You do not know which system produced any review. Do not attempt to infer or name reviewer identities. Judge only the content of the reviews against the repository.

Evaluate the reviews using the frozen rubric in `EVAL_SCORECARD.md`.

## Working rules

- The repository is read-only. Do not modify, add, or delete any file in it.
- You may read, search, and run non-destructive, non-mutating commands to verify claims.
- Do not install dependencies, run builds or tests that write into the repository, start the application, or call any external endpoint or service referenced by the repository.
- Verify findings against the code. Do not accept a finding because it sounds plausible, and do not reject one because it is unfamiliar.
- Write your complete report in Markdown to `SOL_REFEREE_REPORT.md` in the parent directory of the repository's `target` folder. That is the only file you may write.

## Required method

1. **Finding consolidation.** Extract every distinct finding from all four reviews. Merge findings that describe the same underlying issue into one consolidated finding with a stable ID (F-001, F-002, ...). For each consolidated finding, list which reviewers reported it and where in their review.
2. **Classification.** For each reviewer's instance of each finding, assign exactly one:
   - `VALID`: the issue exists in the repository as described, with materially correct evidence.
   - `PARTIAL`: a real issue exists, but the description, evidence, scope, or severity is materially incomplete or partly wrong.
   - `INVALID`: the issue does not exist as described, or the evidence is wrong.
   - `DUPLICATE`: the same reviewer already reported this issue elsewhere in its review.
   - `NOT ADJUDICABLE`: it cannot be confirmed or refuted from the repository under the working rules. State why.
   Give a one-to-three sentence verification note with file and line evidence for each classification.
3. **Significant misses.** List materially important issues you verified in the repository that one or more reviewers did not report. For each, give evidence and state which reviewers missed it.
4. **Unique valid findings.** For each reviewer, list VALID or PARTIAL consolidated findings reported by that reviewer alone.
5. **Dimensional scorecards.** For each of REVIEWER_A, REVIEWER_B, REVIEWER_C, and REVIEWER_D, produce a complete 12-dimension scorecard exactly as defined in `EVAL_SCORECARD.md`. Each row has the raw 0–5 rating, the weighted score `(raw / 5) × weight` to two decimals, and a short scoring rationale grounded in steps 1–4. No row may be blank.
6. **Weighted totals.** Report each reviewer's total out of 100.
7. **Grades and rank.** Assign grades using the bands in `EVAL_SCORECARD.md`. Rank reviewers by weighted total, descending. Report equal totals as ties.
8. **Scoring rationale.** Summarize, per reviewer, the decisive factors behind its total and rank.
9. **Referee uncertainty.** State where your judgments are uncertain, which classifications or ratings could reasonably differ, and what evidence would change them.
10. **Strengths and weaknesses.** For each anonymous reviewer, list its main strengths and main weaknesses as a code reviewer.

## Report structure

1. Summary table: reviewer, total, grade, rank
2. Consolidated finding register with classifications
3. Significant misses
4. Unique valid findings per reviewer
5. Four dimensional scorecards
6. Scoring rationale per reviewer
7. Strengths and weaknesses per reviewer
8. Referee uncertainty
9. Verification log: commands and files you inspected

<!-- END PROMPT -->
