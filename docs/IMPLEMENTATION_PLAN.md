# Implementation Plan

## Goal

Deliver a submission-grade `xlayer-yield-charter` as fast as possible by copying working modules first and only writing new code for the yield-specific treasury layer.

## Phase 0 - Repo scaffold

- copy repo skeleton from `xlayer-trust-leases`
- rename branding, docs, scripts, and data directory
- keep proof and submission surface structure

## Phase 1 - Treasury layer

New code to write:
- `charter/policy.ts`
- `charter/ledger.ts`
- `charter/store.ts`

New state to track:
- principalUsd
- accruedYieldUsd
- harvestedYieldUsd
- spendableYieldUsd
- spentYieldUsd
- remainingYieldBudgetUsd

## Phase 2 - Reuse execution path

Copy from `xlayer-strategy-office`:
- OnchainOS CLI wrapper
- wallet reads
- route quote
- swap execute path

## Phase 3 - Merge with lease gate

Copy from `xlayer-trust-leases`:
- lease envelope
- pre-execution checks
- receipt model
- proof packet model

Adapt checks:
- budget check becomes `request <= spendable yield`
- receipt marks `capitalLayer=yield`
- principal access attempts always block

## Phase 4 - Proof surfaces

Reuse and adapt:
- proof dashboard
- submission page
- status script
- demo video script
- submission form answers

Add panels for:
- principal locked
- harvested yield
- spendable yield
- spent yield

## Phase 5 - Submission hardening

- screenshot assets
- sample proof json
- latest receipt sample
- submission-grade README
- public GitHub repo
- X post draft
- demo video script

## Direct copy order

1. Copy `xlayer-trust-leases` repo skeleton
2. Copy `xlayer-strategy-office` execution files into the new repo
3. Add charter-specific treasury modules
4. Adjust proof / dashboard wording
5. Run first live or semi-live round

## What not to do

- do not rebuild execution from scratch
- do not start with smart contracts if application-layer proof is not done
- do not chase multi-agent committee logic before the principal/yield boundary is working

## Expected v1 narrative

The first version does not need multiple yield sources.
It only needs one clear yield path and one clear spend path.

That is enough to prove the primitive.
