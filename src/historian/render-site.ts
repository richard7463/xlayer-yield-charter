import fs from "node:fs";
import path from "node:path";
import { ProofPacket } from "../core/types.js";
import { RoundArtifactIndexEntry } from "../runtime/store.js";
import { writeProofDashboardHtml } from "./render-html.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function titleCase(value: string): string {
  return value
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortHash(value?: string): string {
  if (!value) {
    return "none";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function ratio(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / total) * 100));
}

function renderRecentRounds(index: RoundArtifactIndexEntry[]): string {
  return index
    .slice(0, 6)
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.generatedAt)}</td>
          <td><span class="table-pill">${escapeHtml(titleCase(entry.outcome))}</span></td>
          <td class="mono">${escapeHtml(shortHash(entry.txHash))}</td>
          <td>${escapeHtml(entry.summary)}</td>
        </tr>
      `
    )
    .join("");
}

function renderCapitalBands(packet: ProofPacket): string {
  const total = Math.max(packet.treasury.totalUsd, packet.charter.principalFloorUsd + packet.yieldLedger.releasedYieldUsd, 0.01);
  const principalWidth = ratio(packet.charter.principalFloorUsd, total);
  const releasedWidth = ratio(packet.yieldLedger.releasedYieldUsd, total);
  const spentWidth = ratio(packet.yieldLedger.spentYieldUsd, total);
  const remainingWidth = ratio(packet.yieldLedger.remainingYieldBudgetUsd, total);

  return `
    <div class="capital-card">
      <div class="card-topline">Capital Boundary</div>
      <h2>The operating budget is harvested yield, not treasury principal.</h2>
      <p>
        The charter separates locked principal from released yield. Every agent request is checked against that released budget before any route or swap path can be used.
      </p>
      <div class="capital-stack">
        <span class="band principal" style="width:${principalWidth}%"></span>
        <span class="band released" style="width:${releasedWidth}%"></span>
        <span class="band spent" style="width:${spentWidth}%"></span>
      </div>
      <div class="capital-grid">
        <div class="capital-row"><span class="swatch principal"></span>Principal floor<strong>${formatUsd(packet.charter.principalFloorUsd)}</strong></div>
        <div class="capital-row"><span class="swatch released"></span>Yield released<strong>${formatUsd(packet.yieldLedger.releasedYieldUsd)}</strong></div>
        <div class="capital-row"><span class="swatch spent"></span>Yield spent<strong>${formatUsd(packet.yieldLedger.spentYieldUsd)}</strong></div>
        <div class="capital-row"><span class="swatch remaining"></span>Yield remaining<strong>${formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</strong></div>
      </div>
      <div class="remaining-bar"><div class="remaining-fill" style="width:${remainingWidth}%"></div></div>
    </div>
  `;
}

export function buildSubmissionHtml(input: {
  packet: ProofPacket;
  index: RoundArtifactIndexEntry[];
  proofDashboardFileName?: string;
}): string {
  const { packet, index } = input;
  const proofDashboardFileName = input.proofDashboardFileName ?? "proof-dashboard.html";
  const productName = titleCase(packet.product);
  const executionTone = packet.execution.status === "broadcasted" ? "ok" : packet.execution.status === "simulated" ? "warn" : "fail";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(productName)} Submission Surface</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #f2efe8;
        --paper: #fcfaf4;
        --paper-strong: #ffffff;
        --ink: #101722;
        --muted: #5f6d7d;
        --line: rgba(16, 23, 34, 0.1);
        --line-strong: rgba(16, 23, 34, 0.18);
        --navy: #0f2236;
        --cyan: #1a7daa;
        --green: #21835d;
        --amber: #a5651b;
        --red: #b94b5c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 12% 10%, rgba(26, 125, 170, 0.08), transparent 24%),
          radial-gradient(circle at 86% 8%, rgba(165, 101, 27, 0.08), transparent 20%),
          linear-gradient(180deg, #f7f4ee 0%, var(--bg) 100%);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(16, 23, 34, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16, 23, 34, 0.03) 1px, transparent 1px);
        background-size: 28px 28px;
        mask-image: linear-gradient(180deg, rgba(255,255,255,0.6), transparent 92%);
      }
      a { color: inherit; }
      .page {
        width: min(1440px, calc(100vw - 28px));
        margin: 14px auto 32px;
      }
      .topbar,
      .hero,
      .feature,
      .panel,
      .capital-card,
      .metric {
        background: rgba(252, 250, 244, 0.84);
        backdrop-filter: blur(14px);
        border: 1px solid var(--line);
        box-shadow: 0 18px 48px rgba(16, 23, 34, 0.08);
      }
      .topbar {
        border-radius: 24px;
        padding: 14px 18px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }
      .brand {
        display: flex;
        gap: 12px;
        align-items: baseline;
      }
      .brand-mark,
      .eyebrow,
      .status-pill,
      .mini-link,
      .card-topline,
      .metric-label,
      .section-label,
      .table-pill,
      th,
      .stack-step {
        font-family: "IBM Plex Mono", monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .brand-mark {
        font-size: 12px;
        color: var(--cyan);
      }
      .brand-title {
        font: 700 24px/1 "Space Grotesk", sans-serif;
      }
      .topbar-links {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .mini-link,
      .status-pill,
      .table-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 9px 12px;
        border: 1px solid var(--line-strong);
        font-size: 11px;
        text-decoration: none;
      }
      .mini-link { background: rgba(255,255,255,0.7); }
      .status-pill.ok { color: var(--green); background: rgba(33, 131, 93, 0.08); }
      .status-pill.warn { color: var(--amber); background: rgba(165, 101, 27, 0.08); }
      .status-pill.fail { color: var(--red); background: rgba(185, 75, 92, 0.08); }
      .hero {
        margin-top: 16px;
        border-radius: 32px;
        padding: 26px;
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
        gap: 18px;
        overflow: hidden;
        position: relative;
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto -150px -180px auto;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(26, 125, 170, 0.14), transparent 70%);
        pointer-events: none;
        filter: blur(16px);
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--cyan);
        font-size: 11px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(26, 125, 170, 0.18);
        background: rgba(26, 125, 170, 0.08);
      }
      .hero h1,
      .capital-card h2,
      .panel h3 {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
      }
      .hero h1 {
        margin-top: 18px;
        font-size: clamp(42px, 5vw, 76px);
        line-height: 0.92;
        max-width: 10ch;
      }
      .hero-copy {
        margin: 18px 0 20px;
        max-width: 64ch;
        color: var(--muted);
        line-height: 1.65;
      }
      .status-row,
      .metrics,
      .feature-grid,
      .panel-grid,
      .capital-grid,
      .data-grid,
      .how-grid {
        display: grid;
        gap: 14px;
      }
      .status-row {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .metrics {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 22px;
      }
      .metric {
        border-radius: 22px;
        padding: 18px;
        background: rgba(255,255,255,0.86);
      }
      .metric-label {
        color: var(--muted);
        font-size: 11px;
      }
      .metric-value {
        margin-top: 10px;
        font: 700 30px/1 "Space Grotesk", sans-serif;
      }
      .metric-note {
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
      }
      .metric-value.cyan { color: var(--cyan); }
      .metric-value.green { color: var(--green); }
      .metric-value.amber { color: var(--amber); }
      .capital-card {
        border-radius: 28px;
        padding: 22px;
        background: linear-gradient(180deg, rgba(15, 34, 54, 0.97), rgba(11, 25, 41, 0.94));
        color: #eef6ff;
      }
      .capital-card p,
      .capital-card .capital-row {
        color: rgba(238, 246, 255, 0.72);
      }
      .card-topline,
      .section-label,
      th { font-size: 11px; color: var(--muted); }
      .capital-card .card-topline { color: rgba(105, 213, 255, 0.8); }
      .capital-stack,
      .remaining-bar {
        overflow: hidden;
        border-radius: 999px;
      }
      .capital-stack {
        display: flex;
        height: 16px;
        margin-top: 18px;
        background: rgba(255,255,255,0.08);
      }
      .band { height: 100%; }
      .band.principal { background: linear-gradient(90deg, #213e60, #365d88); }
      .band.released { background: linear-gradient(90deg, #2a8bb7, #63d4ff); }
      .band.spent { background: linear-gradient(90deg, #cb8930, #f7bf66); }
      .capital-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 16px;
      }
      .capital-row {
        padding: 12px 0;
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      .capital-row strong { color: #ffffff; }
      .swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
      }
      .swatch.principal { background: #365d88; }
      .swatch.released { background: #63d4ff; }
      .swatch.spent { background: #f7bf66; }
      .swatch.remaining { background: #8eedc5; }
      .remaining-bar {
        margin-top: 16px;
        height: 7px;
        background: rgba(255,255,255,0.08);
      }
      .remaining-fill {
        height: 100%;
        background: linear-gradient(90deg, #67dca8, #8eedc5);
      }
      .feature-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 18px;
      }
      .feature,
      .panel { border-radius: 26px; padding: 22px; }
      .feature h3,
      .panel h3 { font-size: 24px; }
      .feature p,
      .panel p,
      .panel li,
      td { color: var(--muted); line-height: 1.62; }
      .feature p,
      .panel p { margin-bottom: 0; }
      .panel-grid {
        grid-template-columns: 1.08fr 0.92fr;
        margin-top: 18px;
      }
      .stack-list {
        margin: 16px 0 0;
        display: grid;
        gap: 12px;
      }
      .stack-step {
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(26, 125, 170, 0.06);
        border: 1px solid rgba(26, 125, 170, 0.12);
        color: var(--cyan);
        font-size: 11px;
      }
      .how-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 18px;
      }
      .how-box {
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.65);
      }
      .data-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }
      .data-card {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.68);
      }
      .data-card .k,
      .mono {
        font-family: "IBM Plex Mono", monospace;
      }
      .data-card .k {
        font-size: 11px;
        color: var(--muted);
        text-transform: uppercase;
      }
      .data-card .v {
        margin-top: 8px;
        color: var(--ink);
        word-break: break-word;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
      }
      th,
      td {
        text-align: left;
        padding: 12px 10px;
        border-top: 1px solid var(--line);
        vertical-align: top;
      }
      .table-pill {
        color: var(--cyan);
        background: rgba(26, 125, 170, 0.08);
      }
      @media (max-width: 1120px) {
        .hero,
        .panel-grid,
        .how-grid,
        .feature-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 900px) {
        .status-row,
        .metrics,
        .capital-grid,
        .data-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 680px) {
        .page { width: min(100vw - 18px, 100%); }
        .topbar,
        .hero,
        .feature,
        .panel,
        .capital-card,
        .metric { border-radius: 22px; }
        .status-row,
        .metrics,
        .capital-grid,
        .data-grid,
        .topbar { grid-template-columns: 1fr; display: grid; }
        .hero h1 { max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="topbar">
        <div class="brand">
          <span class="brand-mark">Build X · Human Track</span>
          <span class="brand-title">${escapeHtml(productName)}</span>
        </div>
        <div class="topbar-links">
          <a class="mini-link" href="./${escapeHtml(proofDashboardFileName)}">Open Proof Dashboard</a>
          <a class="mini-link" href="./live-proof-latest.json">Open Latest JSON</a>
          <span class="status-pill ${executionTone}">Execution ${escapeHtml(titleCase(packet.execution.status))}</span>
        </div>
      </section>

      <section class="hero">
        <div>
          <div class="eyebrow">Treasury Primitive · Pre-Execution Control</div>
          <h1>Give agents the yield. Keep the principal.</h1>
          <p class="hero-copy">
            X Layer Yield Charter is a treasury governance product for autonomous agents. A human treasury owner sets a principal floor, releases harvested yield as operating budget, then lets the agent trade or rebalance only inside that released envelope. If a request exceeds policy, the system resizes or blocks it before any spend happens.
          </p>
          <div class="status-row">
            <span class="status-pill ok">Network X Layer ${packet.execution.chainId}</span>
            <span class="status-pill ok">Consumer ${escapeHtml(packet.charter.consumerName)}</span>
            <span class="status-pill ${packet.decision.outcome === "approve" ? "ok" : packet.decision.outcome === "resize" ? "warn" : "fail"}">Decision ${escapeHtml(titleCase(packet.decision.outcome))}</span>
            <span class="status-pill ${packet.receipt.capitalLayer === "yield" ? "ok" : packet.receipt.capitalLayer === "none" ? "warn" : "fail"}">Capital ${escapeHtml(titleCase(packet.receipt.capitalLayer))}</span>
          </div>
          <div class="metrics">
            <article class="metric">
              <div class="metric-label">Principal Floor</div>
              <div class="metric-value cyan">${formatUsd(packet.charter.principalFloorUsd)}</div>
              <div class="metric-note">Locked treasury base</div>
            </article>
            <article class="metric">
              <div class="metric-label">Released Yield</div>
              <div class="metric-value green">${formatUsd(packet.yieldLedger.releasedYieldUsd)}</div>
              <div class="metric-note">Operating budget made available</div>
            </article>
            <article class="metric">
              <div class="metric-label">Remaining Yield</div>
              <div class="metric-value amber">${formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</div>
              <div class="metric-note">Still spendable this round</div>
            </article>
            <article class="metric">
              <div class="metric-label">Final Notional</div>
              <div class="metric-value ${packet.decision.outcome === "block" ? "red" : "cyan"}">${formatUsd(packet.decision.finalNotionalUsd)}</div>
              <div class="metric-note">Policy-adjusted request size</div>
            </article>
          </div>
        </div>
        ${renderCapitalBands(packet)}
      </section>

      <section class="feature-grid">
        <article class="feature">
          <div class="card-topline">Why This Matters</div>
          <h3>Agent spend should be capital-layer aware.</h3>
          <p>
            Most agent wallets expose raw balances. Yield Charter introduces a stronger boundary: principal stays protected while the agent uses only harvested and released yield.
          </p>
        </article>
        <article class="feature">
          <div class="card-topline">What Is New</div>
          <h3>Governance sits before execution, not after.</h3>
          <p>
            Budget checks, route checks, protocol scope, counterparty scope, and operator posture are enforced before the execution path proceeds.
          </p>
        </article>
        <article class="feature">
          <div class="card-topline">Why X Layer</div>
          <h3>Fits autonomous DeFi treasury operations.</h3>
          <p>
            The system is shaped for X Layer agent flows: treasury balances, agentic execution, route decisions, and inspectable proof packets that judges can read.
          </p>
        </article>
      </section>

      <section class="panel-grid">
        <article class="panel">
          <div class="section-label">Critical Path</div>
          <h3>How a round actually works</h3>
          <p>
            The human defines the budget envelope once. The agent then operates inside that machine-readable policy, and every round produces a receipt and proof surface.
          </p>
          <div class="stack-list">
            <div class="stack-step">1. Human issues charter with principal floor and released yield.</div>
            <div class="stack-step">2. Human issues short-lived lease with asset, protocol, and budget scope.</div>
            <div class="stack-step">3. Agent submits request against the active lease.</div>
            <div class="stack-step">4. Policy engine checks operator state, budget, route, and safety.</div>
            <div class="stack-step">5. Request is allowed, resized, or blocked before execution.</div>
            <div class="stack-step">6. Receipt, JSON proof, and dashboard are written for inspection.</div>
          </div>
        </article>

        <article class="panel">
          <div class="section-label">Latest Operating State</div>
          <h3>Current round at a glance</h3>
          <div class="data-grid">
            <div class="data-card"><div class="k">Charter Id</div><div class="v mono">${escapeHtml(packet.charter.charterId)}</div></div>
            <div class="data-card"><div class="k">Lease Id</div><div class="v mono">${escapeHtml(packet.lease.leaseId)}</div></div>
            <div class="data-card"><div class="k">Asset Pair</div><div class="v">${escapeHtml(packet.request.assetPair)}</div></div>
            <div class="data-card"><div class="k">Venue</div><div class="v">${escapeHtml(packet.request.venueHint)}</div></div>
            <div class="data-card"><div class="k">Outcome</div><div class="v">${escapeHtml(titleCase(packet.decision.outcome))}</div></div>
            <div class="data-card"><div class="k">Tx Hash</div><div class="v mono">${escapeHtml(shortHash(packet.execution.txHash))}</div></div>
          </div>
          <p><strong>Reason:</strong> ${escapeHtml(packet.request.reason)}</p>
          <p><strong>Rationale:</strong> ${escapeHtml(packet.decision.rationale)}</p>
        </article>
      </section>

      <section class="panel" style="margin-top: 18px;">
        <div class="section-label">Judge Readout</div>
        <h3>What judges should immediately see</h3>
        <div class="how-grid">
          <div class="how-box">
            <div class="card-topline">Human Governance Primitive</div>
            <p>A treasury owner can define the principal floor, released yield, and who may consume the released budget.</p>
          </div>
          <div class="how-box">
            <div class="card-topline">OnchainOS In Critical Path</div>
            <p>Wallet state, route evaluation, execution routing, and proof surfaces sit in the decision flow instead of being decorative extras.</p>
          </div>
          <div class="how-box">
            <div class="card-topline">Product Completeness</div>
            <p>Charter issuance, lease issuance, live round execution, JSON proof, dashboard, submission page, and runbooks are all part of the repo.</p>
          </div>
        </div>
      </section>

      <section class="panel" style="margin-top: 18px;">
        <div class="section-label">Audit Trail</div>
        <h3>Recent charter rounds</h3>
        <table>
          <thead>
            <tr>
              <th>Generated</th>
              <th>Outcome</th>
              <th>Tx</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>${renderRecentRounds(index)}</tbody>
        </table>
      </section>
    </div>
  </body>
</html>`;
}

export function buildSiteIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=./submission.html" /><title>X Layer Yield Charter</title></head>
  <body><p>Redirecting to <a href="./submission.html">submission.html</a>...</p></body>
</html>`;
}

export function writeSubmissionSite(input: { packet: ProofPacket; index: RoundArtifactIndexEntry[]; baseDir: string }): { proofDashboardPath: string; submissionPath: string; indexPath: string } {
  const proofDashboardPath = writeProofDashboardHtml({ packet: input.packet, index: input.index, outputPath: path.resolve(input.baseDir, "proof-dashboard.html") });
  const submissionPath = path.resolve(input.baseDir, "submission.html");
  fs.writeFileSync(submissionPath, `${buildSubmissionHtml({ packet: input.packet, index: input.index, proofDashboardFileName: path.basename(proofDashboardPath) })}\n`);
  const indexPath = path.resolve(input.baseDir, "index.html");
  fs.writeFileSync(indexPath, `${buildSiteIndexHtml()}\n`);
  return { proofDashboardPath, submissionPath, indexPath };
}
