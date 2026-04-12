# Scoring Alignment

## OnchainOS / Uniswap Integration

The project uses OnchainOS in the core path, not as a decorative integration:

- Agentic Wallet balance lookup before each round
- DEX route quote before approving a spend
- optional swap execution in live mode
- token safety check before unknown token exposure
- proof packet written after decision / execution

Future direct Uniswap adapter work can be added, but the current V1 already demonstrates the required agentic execution path on X Layer.

## X Layer Ecosystem Fit

This is designed specifically for X Layer agentic DeFi:

- treasury wallet scoped to X Layer chain ID `196`
- small yield-funded operating budgets fit low-cost X Layer execution
- agents can rebalance, pay, and operate without principal access
- proof artifacts make autonomous DeFi operations judge-inspectable

## AI Interactive Experience

The interaction loop is simple and memorable:

```text
human sets principal floor
human releases yield budget
agent proposes action
charter resizes / approves / blocks
proof is written
```

This is stronger than a normal dashboard because it gives agents a usable operating boundary.

## Product Completeness

Implemented:

- charter issuer
- lease issuer
- yield ledger
- pre-execution policy gate
- operator pause / review / resume
- proof JSON
- HTML proof dashboard
- submission page
- OpenClaw runbook
- systemd timer templates
- committed examples

## Best Judge Sentence

Let agents spend yield, not principal.
