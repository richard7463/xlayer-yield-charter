# Architecture

## Core Flow

```text
human treasury owner
-> records principal floor
-> releases harvested yield budget
-> issues execution lease
-> agent proposes spend / rebalance
-> yield charter checks spendable yield
-> lease gate checks wallet, asset, protocol, route, safety, and budget
-> runtime approves, resizes, blocks, or routes to human review
-> receipt + proof packet are written
```

## Main Objects

### Yield Charter

Path: `src/charter/policy.ts`

Defines:

- human owner
- consumer agent
- wallet scope
- principal floor
- released yield budget
- yield source mode
- yield source name

### Yield Ledger

Path: `src/charter/ledger.ts`

Computes:

- treasury value
- principal floor
- treasury buffer
- accrued yield
- released yield
- harvested yield
- spent yield
- remaining yield budget

### Execution Lease

Path: `src/lease/policy.ts`

Checks:

- operator mode
- lease status and expiry
- wallet scope
- reason requirement
- action allowlist
- asset allowlist
- protocol allowlist
- counterparty allowlist
- per-tx budget
- daily budget
- yield budget
- route availability
- price impact
- token safety

### Runtime Agent

Path: `src/runtime/yield-charter-agent.ts`

Responsibilities:

1. read wallet / treasury overview
2. ensure active charter and lease
3. compute yield ledger
4. build trade candidate from allocation drift
5. evaluate charter + lease checks
6. optionally execute through OnchainOS
7. append receipt
8. write proof packet and refresh the Next.js-facing data files

## Proof Packet

The latest proof packet includes:

```text
operator
charter
treasury
yieldLedger
lease
request
checks
usage
decision
execution
receipt
```

Reference: `examples/live-proof-latest.json`

## Deployment Surfaces

- Next.js app router pages in `app/`
- shared UI in `components/`
- CLI scripts in `scripts/`
- systemd templates in `deploy/systemd/`
- data packets in `data/yield-charter/`
- public samples in `examples/`
- optional legacy static HTML exports in `data/yield-charter/*.html`
