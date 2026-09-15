# CR-BENCH-02 — Contestant Prompt

**Status:** FROZEN — 2026-09-15

The operator sends the text between the `BEGIN PROMPT` and `END PROMPT` markers verbatim, as the first and only task message, to every contestant. The markers themselves are not sent. Nothing else in this file is sent.

<!-- BEGIN PROMPT -->

You are acting as an independent senior/principal software engineer performing a code review of the repository in your current working directory.

Review the repository as it exists. Identify the material problems a principal engineer would want surfaced before trusting this system in production, including:

- defects and incorrect behavior
- security and trust-boundary issues
- state, data-consistency, and concurrency problems
- architecture and root-cause problems
- integration failures between components or with external systems
- test and verification weaknesses
- operationally important risks

Working rules:

- Do not modify, add, or delete any file inside the repository.
- You may read files, search, and run non-destructive, non-mutating commands to verify your findings.
- Do not install dependencies, run builds or tests that write into the repository, start the application, or call any external endpoint or service referenced by the repository.
- Work independently. No further guidance will be provided.

Your review must:

- prioritize findings by importance
- give concrete evidence for each finding, such as file paths, line numbers, code paths, and reasoning a maintainer can check
- clearly separate proven findings from conditional concerns that depend on assumptions you could not verify, and state those assumptions
- focus on material issues rather than style preferences

Write your complete review in Markdown to `../REVIEW_REPORT.md`, which is the file named `REVIEW_REPORT.md` in the parent directory of the repository root. That is the only file you may write. When the file is written, reply that the review is complete.

<!-- END PROMPT -->
