# OpenClaw Runbook

Use this to deploy X Layer Yield Charter on OpenClaw / a Linux server.

## Goal

Run a recurring charter round that:

1. reads the X Layer treasury wallet,
2. computes principal floor and released yield budget,
3. builds an agent spend / rebalance candidate,
4. gates it before execution,
5. writes proof JSON + proof dashboard,
6. optionally executes the resized swap in live mode.

## Required Secrets

Create `.env.local` on the server. Do not paste private keys into chat logs.

```bash
XLAYER_RPC_URL=https://xlayer.drpc.org
XLAYER_CHAIN_ID=196
XLAYER_EXPLORER_BASE_URL=https://www.oklink.com/xlayer
XLAYER_TREASURY_ADDRESS=0xdbc8e35ea466f85d57c0cc1517a81199b8549f04
XLAYER_SETTLEMENT_TOKEN_ADDRESS=0x74b7f16337b8972027f6196a17a631ac6de26d22
XLAYER_SETTLEMENT_TOKEN_SYMBOL=USDC
XLAYER_SETTLEMENT_TOKEN_DECIMALS=6

CHARTER_ENV=production
CHARTER_NAME=xlayer-yield-charter
CHARTER_DATA_DIR=data/yield-charter
CHARTER_OPERATOR_NAME=human-treasury-owner
CHARTER_EXECUTION_MODE=live
CHARTER_DEFAULT_BASE_ASSET=USDT0
CHARTER_CONSUMER_NAME=yield-ops-agent
CHARTER_TARGET_ALLOCATIONS=USDT0:60,USDC:30,OKB:10
CHARTER_ALLOWED_ASSETS=USDT0,USDC,OKB
CHARTER_ALLOWED_PROTOCOLS=okx-aggregator,quickswap
CHARTER_ALLOWED_ACTIONS=buy,sell,rebalance
CHARTER_ALLOWED_COUNTERPARTIES=okx-aggregator,quickswap
CHARTER_PER_TX_USD=1
CHARTER_DAILY_BUDGET_USD=3
CHARTER_EXPIRY_HOURS=24
CHARTER_MIN_TRADE_USD=1
CHARTER_MAX_PRICE_IMPACT_PCT=2
CHARTER_PRINCIPAL_FLOOR_USD=4
CHARTER_RELEASED_YIELD_USD=3
CHARTER_SOURCE_MODE=declared_release
CHARTER_YIELD_SOURCE_NAME=xlayer-yield-buffer
```

Server note: do not set proxy variables unless the server actually needs them. On the local Mac, proxy `7890` can be used as `ONCHAINOS_PROXY=http://127.0.0.1:7890`.

## Install

```bash
git clone https://github.com/richard7463/xlayer-yield-charter.git
cd xlayer-yield-charter
npm install
cp .env.example .env.local
# edit .env.local manually
npm run check
```

## Agentic Wallet Login

If the server uses OnchainOS Agentic Wallet instead of a private key, log in once:

```bash
onchainos wallet login
onchainos wallet status
```

Expected: wallet logged in and accessible.

## Preflight

```bash
npm run preflight:treasury
npm run charter:issue
npm run lease:issue
npm run operator:resume -- "production start"
npm run round:live
npm run status:latest
```

Expected outputs:

- `data/yield-charter/live-proof-latest.json`
- `data/yield-charter/receipts/*.json`
- Next.js UI served from `/` and `/proof`
- optional legacy exports in `data/yield-charter/proof-dashboard.html` and `data/yield-charter/submission.html`

## systemd Timer

```bash
sudo mkdir -p /opt/xlayer-yield-charter
sudo cp -R . /opt/xlayer-yield-charter
sudo cp deploy/systemd/xlayer-yield-charter.service /etc/systemd/system/xlayer-yield-charter.service
sudo cp deploy/systemd/xlayer-yield-charter.timer /etc/systemd/system/xlayer-yield-charter.timer
sudo systemctl daemon-reload
sudo systemctl enable --now xlayer-yield-charter.timer
systemctl status xlayer-yield-charter.timer
```

## Validation Commands

```bash
systemctl status xlayer-yield-charter.timer
journalctl -u xlayer-yield-charter.service -n 80 --no-pager
cat data/yield-charter/live-proof-latest.json
```

## Acceptance Criteria

- `npm run check` passes.
- `npm run preflight:treasury` passes.
- `npm run round:live` writes a new proof packet.
- Proof packet includes `charter`, `yieldLedger`, `lease`, `checks`, `decision`, `receipt`.
- If a swap broadcasts, receipt uses `capitalLayer: "yield"`.
- If no route or no yield is available, request is blocked or resized before principal can be touched.
