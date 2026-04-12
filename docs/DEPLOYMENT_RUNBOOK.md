# Deployment Runbook

## Local Demo

```bash
npm install
cp .env.example .env.local
npm run check
npm run demo:prepare
npm run status:latest
npm run demo:serve
```

## Live X Layer Mode

Set `.env.local`:

```bash
CHARTER_EXECUTION_MODE=live
XLAYER_TREASURY_ADDRESS=0xdbc8e35ea466f85d57c0cc1517a81199b8549f04
XLAYER_SETTLEMENT_TOKEN_ADDRESS=0x74b7f16337b8972027f6196a17a631ac6de26d22
CHARTER_PRINCIPAL_FLOOR_USD=4
CHARTER_RELEASED_YIELD_USD=3
```

Then run:

```bash
npm run preflight:treasury
npm run charter:issue
npm run lease:issue
npm run operator:resume -- "live start"
npm run round:live
npm run status:latest
```

## Artifacts

- `data/yield-charter/live-proof-latest.json`
- `data/yield-charter/proof-dashboard.html`
- `data/yield-charter/submission.html`
- `data/yield-charter/index.json`
- `data/yield-charter/receipts/*.json`

## Server Timer

Use `deploy/systemd/xlayer-yield-charter.service` and `deploy/systemd/xlayer-yield-charter.timer`.

The timer default is every 10 minutes.
