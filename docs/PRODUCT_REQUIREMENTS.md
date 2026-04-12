# Product Requirements

## Product Name

X Layer Yield Charter

## One-line description

A principal-locked treasury charter that lets autonomous agents spend only harvested yield on X Layer.

## User problem

Humans want agents to operate autonomously, but they do not want agents to have unconstrained access to treasury principal.

Current choices are both bad:
- give agents broad wallet access
- manually approve every transaction

The missing primitive is a charter that separates principal from spendable operating yield.

## Target user

- human treasury owner
- X Layer DeFi operator
- builder deploying agentic treasury flows
- judge evaluating DeFi-native human-agent coordination

## Non-negotiable product truths

1. principal is locked
2. yield is separately accounted for
3. only harvested yield becomes spendable
4. agent actions remain lease-bound and policy-bound
5. every action leaves a receipt and proof trail

## Core user stories

1. As a human, I deposit principal and know the agent cannot touch it.
2. As a human, I can see how much yield has accrued, been harvested, and is currently spendable.
3. As a human, I can delegate only a portion of spendable yield to an agent.
4. As an agent, I can only execute while my spend request stays within the charter and lease envelope.
5. As a judge, I can inspect principal, yield, spendable budget, receipts, and tx proof in one place.

## Version 1 scope

- principal floor recorded
- yield ledger model
- harvested yield budget model
- lease-gated spend path
- receipt and proof packet
- submission page and proof dashboard

## Version 2 scope

- contract-native charter enforcement
- multiple yield sources
- multiple consumer agents
- optional counterparty trust layer
- optional committee-based yield release
