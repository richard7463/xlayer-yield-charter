# Build X Submission Form Answers

## Project Name & One-Line Description

X Layer Yield Charter — A principal-locked treasury charter that lets autonomous agents spend only harvested yield on X Layer.

## Project Highlights

X Layer Yield Charter is a DeFi-native human governance primitive for autonomous agents.

Most agent finance projects ask humans to either manually approve every transaction or give agents broad wallet access. Yield Charter introduces a safer third model: humans keep principal locked, release only harvested yield as operating budget, and agents can spend only inside that yield envelope.

What makes it stand out:

- Principal floor: the human owner defines the minimum treasury principal that agents cannot touch.
- Yield ledger: accrued, released, harvested, spent, and remaining yield are tracked separately from principal.
- Pre-execution gate: every agent request is checked before execution against operator mode, wallet scope, lease status, expiry, asset allowlist, protocol allowlist, counterparty allowlist, per-tx budget, daily budget, yield budget, route availability, price impact, and token safety.
- Resize instead of blind reject: if an agent asks for too much, the charter can resize it to the released-yield budget.
- Proof surfaces: each round writes JSON proof, a proof dashboard, a submission page, and receipts that judges can inspect.
- OnchainOS path: the runtime is built around Agentic Wallet balance reads, route quotes, optional live swap execution, and token safety checks.

The core idea is simple: let agents spend yield, not principal.

## Your Track

X Layer Arena

## Team Members & Contact Information

Richard — builder — @Richard_buildai

## Agentic Wallet Address

0xdbc8e35ea466f85d57c0cc1517a81199b8549f04

## GitHub Repository Link

https://github.com/richard7463/xlayer-yield-charter

## OnchainOS Usage

The project uses OnchainOS / Agentic Wallet in the runtime path:

- Agentic Wallet balance: reads the X Layer treasury wallet before each round.
- DEX quote / route: checks whether the proposed yield-funded spend has a valid route.
- Swap execution: in live mode, broadcasts the resized yield-funded swap through the Agentic Wallet flow.
- Token safety: scans unknown target tokens before execution.
- Proof / audit: writes decision packets and receipts that include wallet, charter, lease, route, budget, and tx evidence.

The key point is that OnchainOS is not a side widget. It is part of the critical path before an agent spend is approved.

## Demo Video Link

Fill after recording.

## X Post Link

Fill after posting.

## Demo Script Summary

1. Show the problem: agents should not have unlimited treasury access.
2. Show the charter: principal floor and released yield budget.
3. Run `npm run round:live`.
4. Show the request being resized to stay inside released yield.
5. Open `examples/live-proof-latest.json` and the proof dashboard.
6. Explain that live mode can broadcast through Agentic Wallet, while sample mode proves policy and receipt flow.
