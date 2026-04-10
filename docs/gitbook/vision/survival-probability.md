# Survival Probability Analysis

Limer's Capital models its long-term survival probability using a modified hazard function that accounts for both decay and antifragile growth.

## The Model

```
P(T) = e^(-lambda*T) * (1 + alpha*T)^beta
```

Where:
- **P(T)** = probability of surviving T years
- **lambda** = base hazard rate (failure probability per year)
- **alpha** = antifragility coefficient (how much adversity strengthens the protocol)
- **beta** = institutional resilience exponent (governance and structural durability)

## Current State

| Parameter | Current Value | Target Value |
|-----------|--------------|--------------|
| P(100) | 10% | 29% |
| Lambda | 0.045 | 0.028 |
| Alpha | 0.012 | 0.025 |
| Beta | 1.8 | 2.6 |

## 8 Interventions Across 3 Parameters

### Lambda Reduction (Lower Failure Rate)

1. **Multi-sig treasury** -- Squads 3-of-5 eliminates single-point-of-failure risk
2. **Documentation and knowledge transfer** -- reduces bus factor from 1
3. **Reduce critical radius** -- modular architecture so no single component is fatal
4. **University partnerships** -- UWI/UTT pipeline for developer continuity
5. **Chain abstraction** -- reduce Solana dependency via cross-chain compatibility
6. **Second jurisdiction** -- Bermuda DABA registration diversifies regulatory risk

### Alpha Enhancement (Increase Antifragility)

7. **Antifragile treasury** -- barbell strategy (80% stables, 20% high-conviction positions)
8. **Open-source protocol** -- community can fork and continue if the team cannot

### Beta Enhancement (Institutional Resilience)

- **Protocol Charter** -- irrevocable governance commitments (education free, 50% revenue share)
- **Advisory Council** -- independent oversight with veto power on charter amendments

## Impact

These 8 interventions shift P(100) from 10% to 29% -- nearly tripling the probability that the protocol survives a century.

[See the Centennial Evolution Model -->](centennial-model.md)
