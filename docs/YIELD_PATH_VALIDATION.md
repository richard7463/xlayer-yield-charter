# Yield Path Validation

## Current V1 Yield Path

V1 uses a human-declared yield release model:

```text
treasury value
- principal floor
= treasury buffer
human release <= treasury buffer
agent spend <= released yield
```

This is deliberate. It proves the principal/yield accounting and spend boundary before adding protocol-specific vault adapters.

## Current Proof

The committed sample proof shows:

- treasury value: `$11.80`
- principal floor: `$4.00`
- treasury buffer: `$7.80`
- released yield: `$3.00`
- remaining yield budget: `$3.00`
- latest agent request: `$1.68`
- final notional after policy gate: `$1.00`
- result: `resize`

Reference: [`examples/live-proof-latest.json`](../examples/live-proof-latest.json)

## Why This Is Valid For V1

The project's core claim is not APY performance. The core claim is spend boundary enforcement:

1. principal is accounted separately
2. released yield is accounted separately
3. agent spend is constrained to released yield
4. every decision writes proof
5. live mode can route the approved spend through Agentic Wallet

## Next Yield Adapter

The next production adapter should connect direct DeFi positions through OnchainOS DeFi APIs:

```text
OnchainOS DeFi position read
-> accrued yield observed
-> harvest event recorded
-> released budget updated
-> agent spend consumes released yield
```

The existing `YieldLedgerSnapshot` already has the fields needed for this adapter:

- `accruedYieldUsd`
- `releasedYieldUsd`
- `harvestedYieldUsd`
- `spentYieldUsd`
- `remainingYieldBudgetUsd`
