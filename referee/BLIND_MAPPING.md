# CR-BENCH-02 — Blind Mapping

**Status:** SEALED — DO NOT PROVIDE TO SOL OR JARVIS BEFORE REVEAL

**Sealed:** 2026-09-16 by the evidence custodian. Reveal authority: Tony Stark.

This file is the only artifact in the benchmark that links blind reviewer letters to contestant identities. It must not be copied into the Sol referee workspace, the Jarvis adjudication materials, or any report produced before reveal.

## Mapping

| Blind slot | Contestant | Source raw report | Frozen raw SHA-256 | Blind artifact SHA-256 |
|---|---|---|---|---|
| REVIEWER_A | Fable 5.1 | `contestants/fable-5.1/REVIEW_REPORT.md` | `5c37091b7ff9e2d2691b33dac41f3fd6821ae76370c1deda90031fd7423b670d` | `9f80246eaec84652fa792cba7a39e2975a70244a08eff54f2836fd0843bf8abe` |
| REVIEWER_B | GLM 5.3 | `contestants/glm-5.3/REVIEW_REPORT.md` | `8a8e5efeb30e5091e2fdb0d2c43566c47f1627b3b8e3f2c9ddcbabdabc91c92f` | `4e3f95321034a4ab7050402bcbf951238a98d24bc15fd3987faeb7d60d4a5da8` |
| REVIEWER_C | Astra | `contestants/astra/REVIEW_REPORT.md` | `20b5e335013010f7c1866dc4b83c167767dfae81eff82939a6bcb60e32fbceb5` | `00acc492ab31fb07c02df80f34f87dd2c617dcca247192440161b69b3499b554` |
| REVIEWER_D | GLM 5.3 Flash | `contestants/glm-5.3-flash/REVIEW_REPORT.md` | `3175b4ae58ed91e94938c5e9e5079e83fdb2efeb7fc12b15bf9171828637c23c` | `585be90059dd4c5fffae53db29d6bb6f8e45ecb883acd3393fffe9a35badbcd9` |

## Randomization method

Per BENCHMARK_RULES R12.2, assignment used a recorded random method. A 32-byte seed was drawn from the operating system CSPRNG (`secrets.token_hex(32)`). Contestant slugs sorted in C locale were ordered by SHA-256 of `<seed>:<slug>`, ascending, and assigned to REVIEWER_A through REVIEWER_D in that order. The draw was computed once, with no re-draws.

Sealed seed (do not publish before reveal):

```
822d15212c98361ac52998602a1b6397d759a51f63bc10ef08408b84be5ec26a
```

Recompute after reveal:

```python
import hashlib
sorted(['astra','fable-5.1','glm-5.3','glm-5.3-flash'],
       key=lambda s: hashlib.sha256((SEED+':'+s).encode()).hexdigest())
```

## Redaction log

Every change made to a raw report when producing its blind copy. No other bytes were altered. Line numbers refer to the raw report.

| Blind slot | Contestant | Line | Reason | Replacement |
|---|---|---:|---|---|
| REVIEWER_A | Fable 5.1 | 3 | header contains contestant name and exact model identifier | `[IDENTITY REDACTED]` |
| REVIEWER_D | GLM 5.3 Flash | 211 | closing line contains contestant folder paths | `[IDENTITY REDACTED]` |
| REVIEWER_B | GLM 5.3 | 3 | header contains contestant name; run-position metadata removed as identity-linked | `[IDENTITY REDACTED]` |
| REVIEWER_C | Astra | 1 | title contains contestant name | `[IDENTITY REDACTED]` |

Verification: each blind copy has the same line count as its raw source, and no content outside these substitutions was changed.

## Identity leak scan

Blind copies were scanned case-insensitively for: astra, fable, glm, claude, ollama, codex, openai, anthropic, gpt, zhipu, contestants/, run_notes, run 1-4, weekly, 5-hour, token, quota. Three hits were reviewed and retained as genuine technical content:

- `token` in a Stripe webhook remediation sentence.
- `fable` inside the word "spoofable".
- `RUN_NOTES.md` as a filename whose identifying directory path was already redacted.

No contestant name, exact model identifier, provider or interface identity, or operational/economic data remains in any blind copy.
