# CR-BENCH-02 — Run Order

**Status:** RANDOMIZED / FROZEN — 2026-09-15

## Frozen order

| Run | Contestant | Wave |
|---:|---|---|
| 1 | Fable 5.1 | First wave (randomized) |
| 2 | GLM 5.3 Flash | First wave (randomized) |
| 3 | GLM 5.3 | First wave (randomized) |
| 4 | Astra | Deferred (scheduled, not randomized) |

## Disclosed scheduling constraint

Astra is unavailable for the first wave. Astra is therefore explicitly scheduled as the deferred fourth run because of availability. Astra's position was not randomized. Only the order of Fable 5.1, GLM 5.3, and GLM 5.3 Flash was randomized.

The first-wave order is frozen and must not be altered afterward.

## Randomization method

The seed is the SHA-256 of the frozen `TARGET_MANIFEST.sha256`, which was fixed before this order was drawn:

```
e812f09142a3f66eb726d1719ff01c6629c84534da24e2bf58856ccd7382b0ea
```

For each first-wave contestant, compute SHA-256 of the string `CR-BENCH-02:<seed>:<contestant name>`. Order contestants by that digest, ascending, in C locale. The draw was computed once, with no re-draws.

| Digest | Contestant |
|---|---|
| `1f08fd43973e0190d5ed014e8943a002f59eedb5f80f0f5fbc79300e011c90a1` | Fable 5.1 |
| `c2c5935141eabe9c96c237372396a81df7ca9981065645409c8cebbaad2f948a` | GLM 5.3 Flash |
| `fcc9f0b7d77d324c3a3a6b73b4efa33d6a23e8d38619e09337fa39565a5f245e` | GLM 5.3 |

Recompute:

```bash
M=$(sha256sum TARGET_MANIFEST.sha256 | cut -d' ' -f1)
for n in "Fable 5.1" "GLM 5.3" "GLM 5.3 Flash"; do
  echo "$(printf '%s' "CR-BENCH-02:$M:$n" | sha256sum | cut -d' ' -f1)  $n"
done | LC_ALL=C sort
```

Disclosure: the custodian chose this method after the seed value existed. The method is fully reproducible, and the result was accepted on its single computation.
