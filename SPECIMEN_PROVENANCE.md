# CR-BENCH-02 — Specimen Provenance

**Status:** CERTIFIED / FROZEN

- **Benchmark:** CR-BENCH-02
- **Target:** dockbloxx-production-v1
- **Benchmark path:** `target/dockbloxx-production-v1`
- **Source repository:** https://github.com/ahmedmusawir/dockbloxx-production-v1
- **Pinned source commit:** `059ccdba8174cf9c11628002387a9676b1785287`
- **Commit tree object:** `4879d4712e223a816ff621dd29bcd04c2f66ca51`

## Source verification method

- Remote ref lookup: `git ls-remote … refs/heads/main` returned `059ccdba8174cf9c11628002387a9676b1785287` (2026-09-14 and re-confirmed 2026-09-15).
- Fresh independent materialization of the pinned commit in new temporary directories outside the benchmark repository, from GitHub's archive endpoint for the exact SHA. The archive's embedded commit header matched the SHA.
- Second independent source: GitHub API commit tree for the SHA (recursive, not truncated): 362 blobs, 0 submodules, 0 symlinks.
- Recursive comparison of the materialized source against the target, excluding only `.git`: no differences.
- Per-file comparison of target git blob IDs and file modes against the commit tree: 0 mismatches.
- Custodian note: the source was materialized from the archive and API, not via `git clone` + `git checkout`, because the custodian's standing rules prohibit git checkout. The source contains no `.gitattributes`, so no files are subject to archive export exclusion.

## Results

- **Parity result:** PASS — target identical to pinned source commit excluding .git (362/362 regular files, 113/113 directories, identical paths, content and executable bits).
- **Parity history:** Attempt 1 (2026-09-14) FAILED because the target lacked root `.gitignore`. Tony replaced the target from a fresh clone of the pinned SHA with only `.git` removed. Attempt 2 and an independent discrepancy re-check (2026-09-14) PASSED.
- **Nested target .git:** ABSENT
- **Target mutation during certification:** NONE (target hash set identical across every certification run)
- **Safety disposition:** PASS — SAFE TO FREEZE FOR BENCHMARK (see TARGET_SAFETY_CHECK.md)
- **Target freeze status:** FROZEN
- **SHA-256 manifest:** `TARGET_MANIFEST.sha256` — 362 entries, `sha256sum -c` 362/362 OK
- **Manifest file SHA-256:** `e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea`
- **Parity verification date:** 2026-09-14
- **Freeze date:** 2026-09-15
