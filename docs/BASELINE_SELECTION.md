# Baseline Selection

## Chosen baseline

Build `xlayer-yield-charter` by copying from `xlayer-trust-leases` first.

## Why this baseline wins

`xlayer-trust-leases` already has the correct control skeleton:
- pre-execution authority envelope
- receipt writing
- proof packet shape
- dashboard and submission surfaces
- shared Agentic Wallet flow

Yield Charter should not replace that. It should add a deeper treasury model underneath it.

## Layering model

```text
Yield Charter
= Trust Leases
+ principal floor
+ yield ledger
+ harvest accounting
+ spendable yield budget
```

## Direct internal copy map

### Copy from `xlayer-trust-leases`

- `src/config/env.ts`
- `src/core/types.ts`
- `src/lease/`
- `src/runtime/operator-state.ts`
- `src/runtime/store.ts`
- `src/historian/`
- `scripts/issue-lease.ts`
- `scripts/status-latest.ts`
- `scripts/render-proof.ts`
- docs and submission README structure

### Copy from `xlayer-strategy-office`

- `src/onchainos/cli.ts`
- `src/portfolio/manager.ts`
- `src/treasury/xlayer.ts`
- live quote / execute path
- local + OpenClaw env conventions

### Adapt, not copy blindly

- `lease` becomes `charter + lease`
- treasury snapshot becomes `principal / yield / spendable yield`
- receipt adds `capitalLayer` fields
- proof dashboard adds treasury layer panels

## External pattern donors

### SpendControl / AgentVault
Use for:
- treasury primitive framing
- spend reasons
- principal safety sentence
- budget boundary semantics

### Trust Zones
Use for:
- relationship / authority decomposition
- structured policy language

### Chorus
Use for:
- delegated authority wording
- optional committee extension path

### Universal Trust
Use for:
- README and judge quick-links structure
