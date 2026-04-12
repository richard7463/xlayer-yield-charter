import fs from "node:fs";
import path from "node:path";
import { ProofPacket } from "../core/types.js";
import { RoundArtifactIndexEntry } from "../runtime/store.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderChecks(packet: ProofPacket): string {
  return packet.checks
    .map(
      (check) => `
        <tr>
          <td>${escapeHtml(check.label)}</td>
          <td>${check.ok ? "pass" : "fail"}</td>
          <td>${escapeHtml(check.note)}</td>
        </tr>
      `
    )
    .join("");
}

function renderRounds(index: RoundArtifactIndexEntry[]): string {
  return index
    .slice(0, 10)
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.generatedAt)}</td>
          <td>${escapeHtml(entry.outcome)}</td>
          <td class="mono">${escapeHtml(entry.txHash ?? "none")}</td>
          <td>${escapeHtml(entry.summary)}</td>
        </tr>
      `
    )
    .join("");
}

export function buildProofDashboardHtml(input: {
  packet: ProofPacket;
  index: RoundArtifactIndexEntry[];
}): string {
  const { packet, index } = input;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(packet.product)}</title>
    <style>
      :root {
        --bg: #efe7d4;
        --panel: #fff9ee;
        --ink: #171510;
        --muted: #635a49;
        --line: #d8ccb4;
        --accent: #0f766e;
        --warn: #9a3412;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next Condensed", "Franklin Gothic Medium", "Arial Narrow", sans-serif;
        color: var(--ink);
        background: radial-gradient(circle at top left, #fff5d6 0, transparent 32%), linear-gradient(180deg, #eadfc6 0%, var(--bg) 100%);
      }
      .wrap { width: min(1260px, calc(100vw - 32px)); margin: 24px auto 56px; }
      .hero, .panel { border: 1px solid var(--line); border-radius: 24px; background: var(--panel); box-shadow: 0 14px 40px rgba(50, 36, 12, 0.08); }
      .hero { padding: 28px; }
      .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-top: 18px; }
      .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 18px; }
      .metric { border: 1px solid var(--line); border-radius: 18px; padding: 16px; background: #fffdf7; }
      .metric .label { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
      .metric .value { font-size: 30px; margin-top: 8px; }
      .panel { padding: 22px; }
      .span-12 { grid-column: 1 / -1; }
      .span-8 { grid-column: span 8; }
      .span-6 { grid-column: span 6; }
      .span-4 { grid-column: span 4; }
      h1 { margin: 10px 0 6px; font-size: 48px; line-height: .95; }
      h2 { margin: 0 0 12px; font-size: 24px; }
      p { color: var(--muted); line-height: 1.55; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 8px; border-top: 1px solid var(--line); text-align: left; vertical-align: top; }
      th { color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      .accent { color: var(--accent); }
      .warn { color: var(--warn); }
      @media (max-width: 980px) { .metrics { grid-template-columns: 1fr; } .span-4, .span-6, .span-8 { grid-column: 1 / -1; } h1 { font-size: 36px; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <div style="text-transform: uppercase; letter-spacing: .14em; color: var(--muted); font-size: 12px;">Principal locked · Yield spendable · X Layer</div>
        <h1>${escapeHtml(packet.product)}</h1>
        <p>
          A human treasury owner sets a principal floor, releases a bounded amount of harvested yield,
          then lets an agent operate only inside that released budget. The agent never gets principal access.
        </p>
        <div class="metrics">
          <div class="metric"><div class="label">Principal floor</div><div class="value">$${packet.charter.principalFloorUsd.toFixed(2)}</div></div>
          <div class="metric"><div class="label">Released yield</div><div class="value accent">$${packet.yieldLedger.releasedYieldUsd.toFixed(2)}</div></div>
          <div class="metric"><div class="label">Remaining yield</div><div class="value accent">$${packet.yieldLedger.remainingYieldBudgetUsd.toFixed(2)}</div></div>
          <div class="metric"><div class="label">Outcome</div><div class="value">${escapeHtml(packet.decision.outcome)}</div></div>
          <div class="metric"><div class="label">Execution</div><div class="value ${packet.execution.status === "broadcasted" ? "accent" : "warn"}">${escapeHtml(packet.execution.status)}</div></div>
        </div>
      </section>

      <section class="grid">
        <article class="panel span-8">
          <h2>Yield Charter</h2>
          <table>
            <thead><tr><th>Field</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Charter ID</td><td class="mono">${escapeHtml(packet.charter.charterId)}</td></tr>
              <tr><td>Consumer</td><td>${escapeHtml(packet.charter.consumerName)}</td></tr>
              <tr><td>Wallet</td><td class="mono">${escapeHtml(packet.charter.walletAddress ?? "unscoped")}</td></tr>
              <tr><td>Source mode</td><td>${escapeHtml(packet.charter.yieldSourceMode)}</td></tr>
              <tr><td>Yield source</td><td>${escapeHtml(packet.charter.yieldSourceName)}</td></tr>
              <tr><td>Principal floor</td><td>$${packet.charter.principalFloorUsd.toFixed(2)}</td></tr>
              <tr><td>Released yield</td><td>$${packet.charter.releasedYieldUsd.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </article>

        <article class="panel span-4">
          <h2>Yield Ledger</h2>
          <p><strong>Treasury:</strong> $${packet.yieldLedger.treasuryUsd.toFixed(2)}</p>
          <p><strong>Treasury buffer:</strong> $${packet.yieldLedger.treasuryBufferUsd.toFixed(2)}</p>
          <p><strong>Accrued yield:</strong> $${packet.yieldLedger.accruedYieldUsd.toFixed(2)}</p>
          <p><strong>Harvested yield:</strong> $${packet.yieldLedger.harvestedYieldUsd.toFixed(2)}</p>
          <p><strong>Spent yield:</strong> $${packet.yieldLedger.spentYieldUsd.toFixed(2)}</p>
          <p><strong>Remaining:</strong> $${packet.yieldLedger.remainingYieldBudgetUsd.toFixed(2)}</p>
        </article>

        <article class="panel span-6">
          <h2>Execution Lease</h2>
          <p><strong>Lease ID:</strong> <span class="mono">${escapeHtml(packet.lease.leaseId)}</span></p>
          <p><strong>Budget:</strong> $${packet.lease.perTxUsd} per tx / $${packet.lease.dailyBudgetUsd} per day</p>
          <p><strong>Assets:</strong> ${packet.lease.allowedAssets.map(escapeHtml).join(", ")}</p>
          <p><strong>Protocols:</strong> ${packet.lease.allowedProtocols.map(escapeHtml).join(", ")}</p>
          <p><strong>Expires:</strong> ${escapeHtml(packet.lease.expiresAt)}</p>
        </article>

        <article class="panel span-6">
          <h2>Latest Request</h2>
          <p><strong>${escapeHtml(packet.request.assetPair)}</strong></p>
          <p>Action: ${escapeHtml(packet.request.action)}</p>
          <p>Venue: ${escapeHtml(packet.request.venueHint)}</p>
          <p>Requested: $${packet.request.notionalUsd}</p>
          <p>Final: $${packet.decision.finalNotionalUsd}</p>
          <p>${escapeHtml(packet.request.reason)}</p>
        </article>

        <article class="panel span-6">
          <h2>Checks</h2>
          <table>
            <thead><tr><th>Check</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>${renderChecks(packet)}</tbody>
          </table>
        </article>

        <article class="panel span-6">
          <h2>Receipt</h2>
          <p><strong>Status:</strong> ${escapeHtml(packet.receipt.status)}</p>
          <p><strong>Capital layer:</strong> ${escapeHtml(packet.receipt.capitalLayer)}</p>
          <p><strong>Spent:</strong> $${packet.receipt.spentUsd.toFixed(2)}</p>
          <p><strong>Tx:</strong> <span class="mono">${escapeHtml(packet.execution.txHash ?? "none")}</span></p>
          <p><strong>Explorer:</strong> ${packet.execution.explorerUrl ? `<a href="${escapeHtml(packet.execution.explorerUrl)}">open</a>` : "none"}</p>
          <p><strong>Note:</strong> ${escapeHtml(packet.receipt.note)}</p>
        </article>

        <article class="panel span-12">
          <h2>Recent Charter Rounds</h2>
          <table>
            <thead><tr><th>Generated</th><th>Outcome</th><th>Tx</th><th>Summary</th></tr></thead>
            <tbody>${renderRounds(index)}</tbody>
          </table>
        </article>
      </section>
    </div>
  </body>
</html>`;
}

export function writeProofDashboardHtml(input: { packet: ProofPacket; index: RoundArtifactIndexEntry[]; outputPath: string }): string {
  fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
  fs.writeFileSync(input.outputPath, `${buildProofDashboardHtml(input)}\n`);
  return input.outputPath;
}
