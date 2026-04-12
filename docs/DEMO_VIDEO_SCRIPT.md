# Demo Video Script

Target length: 60 to 90 seconds.

## 0-10s: Problem

"Autonomous agents can trade and pay onchain, but giving them full treasury access is unsafe. X Layer Yield Charter solves this by letting agents spend yield, not principal."

Show README title and Judge Summary.

## 10-25s: Charter

Open `examples/live-proof-latest.json`.

Point to:

- `charter.principalFloorUsd`
- `charter.releasedYieldUsd`
- `yieldLedger.remainingYieldBudgetUsd`

Narration:

"The human owner sets a principal floor and releases only harvested yield as operating budget. This budget is separate from treasury principal."

## 25-45s: Run Round

Run:

```bash
npm run status:latest
npm run round:live
npm run status:latest
```

Narration:

"The agent proposes a rebalance. The charter checks whether the request fits the released yield budget. If it asks for too much, the request is resized before execution."

## 45-65s: Proof Dashboard

Open:

```text
data/yield-charter/proof-dashboard.html
```

Show:

- Principal floor
- Released yield
- Remaining yield
- Execution status
- Checks table
- Receipt panel

Narration:

"This is the proof surface judges can inspect. It shows the charter, lease, checks, decision, receipt, and optional tx hash."

## 65-90s: Why It Matters

Narration:

"The project is not a trading bot. It is a treasury control primitive for agentic DeFi. Humans keep principal. Agents operate only on yield. Every spend leaves a reason and receipt."

## Closing Line

"X Layer Yield Charter: let agents spend yield, not principal."
