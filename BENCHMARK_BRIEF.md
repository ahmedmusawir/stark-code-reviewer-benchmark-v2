# CR-BENCH-02 — DockBloxx Production Code Reviewer Championship

**Status:** FROZEN — 2026-09-15

## Benchmark question

Which of Astra, Fable 5.1, GLM 5.3, and GLM 5.3 Flash naturally produces the strongest independent senior/principal code review of the exact same frozen DockBloxx production snapshot under equal review conditions?

## Benchmark type

RAW REVIEW benchmark. Each contestant receives only the frozen target and one identical raw review prompt. Contestants do not receive:

- the scoring rubric
- expected findings
- known DockBloxx defects
- any previous Fable review
- reviewer playbooks
- commerce or security checklists
- other contestant outputs

## Frozen specimen

- **Target:** `target/dockbloxx-production-v1`
- **Source:** https://github.com/ahmedmusawir/dockbloxx-production-v1
- **Pinned commit:** `059ccdba8174cf9c11628002387a9676b1785287`
- **Manifest:** `TARGET_MANIFEST.sha256`, 362 entries, SHA-256 `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea`

## Contestants

- Astra
- Fable 5.1
- GLM 5.3
- GLM 5.3 Flash

## Roles

| Role | Holder |
|---|---|
| Primary blind referee | Sol — High reasoning |
| Blind adjudicator | Jarvis |
| Reveal authority / Git authority | Tony Stark |
| Benchmark maintenance / evidence custodian | Claude Code session (non-contestant, non-referee) |

## Instrument

| Artifact | Purpose |
|---|---|
| `BENCHMARK_RULES.md` | Frozen execution, isolation, blinding and reveal rules |
| `RUN_ORDER.md` | Frozen contestant order and disclosed scheduling constraint |
| `EVAL_SCORECARD.md` | Frozen 12-dimension, 100-point scorecard (withheld from contestants) |
| `MODEL_MANIFEST.md` | Runtime identity and configuration record (withheld from Sol and Jarvis) |
| `templates/CONTESTANT_PROMPT.md` | Frozen identical raw review prompt |
| `templates/RUN_NOTES_TEMPLATE.md` | Frozen run-notes format |
| `templates/CONTESTANT_CLOSEOUT_TEMPLATE.md` | Frozen mechanical closeout checklist |
| `templates/REFEREE_PROMPT.md` | Frozen Sol blind referee methodology |

## Pipeline

1. Contestant runs in frozen order, each followed by mechanical closeout.
2. Blind packaging of the four frozen raw reports as REVIEWER_A through REVIEWER_D.
3. Sol blind referee scoring, frozen.
4. Jarvis blind adjudication, frozen.
5. Identity reveal by Tony.
6. Operational usage reconnected, final reports written.
