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

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
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

function renderChecks(packet: ProofPacket): string {
  return packet.checks
    .map((check) => {
      const tone = check.ok ? "ok" : "fail";
      const icon = check.ok ? "PASS" : "BLOCK";
      return `
        <article class="check-card ${tone}">
          <div class="check-topline">
            <span class="check-icon">${icon}</span>
            <span class="check-label">${escapeHtml(check.label)}</span>
          </div>
          <p>${escapeHtml(check.note)}</p>
        </article>
      `;
    })
    .join("");
}

function renderRounds(index: RoundArtifactIndexEntry[]): string {
  return index
    .slice(0, 8)
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

function renderRouteHints(packet: ProofPacket): string {
  const hints = [
    `Action ${titleCase(packet.request.action)}`,
    `Venue ${packet.request.venueHint}`,
    `Counterparty ${packet.request.counterparty}`,
    `Trust zone ${titleCase(packet.decision.trustZone)}`,
    ...packet.decision.policyHits.map((hit) => `Policy ${titleCase(hit)}`)
  ];

  return hints
    .map((hint) => `<span class="mini-pill">${escapeHtml(hint)}</span>`)
    .join("");
}

function renderCapitalMeter(packet: ProofPacket): string {
  const total = Math.max(packet.treasury.totalUsd, packet.charter.principalFloorUsd + packet.yieldLedger.releasedYieldUsd, 0.01);
  const principalWidth = ratio(packet.charter.principalFloorUsd, total);
  const releasedWidth = ratio(packet.yieldLedger.releasedYieldUsd, total);
  const spentWidth = ratio(packet.yieldLedger.spentYieldUsd, total);
  const remainingWidth = ratio(packet.yieldLedger.remainingYieldBudgetUsd, total);

  return `
    <div class="meter-card">
      <div class="meter-head">
        <div>
          <div class="eyebrow">Treasury Rules</div>
          <h2>Agent budget vs locked treasury</h2>
        </div>
        <div class="meter-total">${formatCompactUsd(packet.treasury.totalUsd)}</div>
      </div>
      <div class="meter-bar">
        <span class="segment principal" style="width:${principalWidth}%"></span>
        <span class="segment released" style="width:${releasedWidth}%"></span>
        <span class="segment spent" style="width:${spentWidth}%"></span>
      </div>
      <div class="meter-legend">
        <div><span class="swatch principal"></span>Principal locked <strong>${formatUsd(packet.charter.principalFloorUsd)}</strong></div>
        <div><span class="swatch released"></span>Yield released <strong>${formatUsd(packet.yieldLedger.releasedYieldUsd)}</strong></div>
        <div><span class="swatch spent"></span>Yield spent <strong>${formatUsd(packet.yieldLedger.spentYieldUsd)}</strong></div>
        <div><span class="swatch remaining"></span>Yield still spendable <strong>${formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</strong></div>
      </div>
      <p class="meter-note">
        This is the product boundary. The agent only gets the released budget. If a request is too large or outside policy, it is resized or blocked before any X Layer execution path is reached.
      </p>
      <div class="remaining-track">
        <div class="remaining-fill" style="width:${remainingWidth}%"></div>
      </div>
    </div>
  `;
}

export function buildProofDashboardHtml(input: {
  packet: ProofPacket;
  index: RoundArtifactIndexEntry[];
}): string {
  const { packet, index } = input;
  const productName = titleCase(packet.product);
  const executionTone = packet.execution.status === "broadcasted" ? "ok" : packet.execution.status === "simulated" ? "warn" : "fail";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(productName)} Control Tower</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #07111b;
        --bg-soft: #0c1928;
        --panel: rgba(10, 21, 34, 0.88);
        --panel-strong: #0f2133;
        --line: rgba(130, 167, 197, 0.2);
        --line-strong: rgba(130, 167, 197, 0.35);
        --text: #ecf6ff;
        --muted: #8da5bb;
        --cyan: #69d5ff;
        --green: #6ff0ba;
        --amber: #f7bf66;
        --red: #ff7f7f;
        --navy: #08192a;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "IBM Plex Sans", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(105, 213, 255, 0.16), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(247, 191, 102, 0.16), transparent 20%),
          linear-gradient(180deg, #040b12 0%, var(--bg) 45%, #050d14 100%);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: linear-gradient(180deg, rgba(255,255,255,0.75), transparent 92%);
      }
      a { color: inherit; }
      .shell {
        width: min(1480px, calc(100vw - 28px));
        margin: 14px auto 28px;
        display: grid;
        grid-template-columns: 290px minmax(0, 1fr);
        gap: 18px;
      }
      .rail,
      .panel,
      .hero,
      .meter-card,
      .stat,
      .check-card {
        border: 1px solid var(--line);
        background: var(--panel);
        backdrop-filter: blur(16px);
        box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
      }
      .rail {
        border-radius: 28px;
        padding: 22px 18px;
        position: sticky;
        top: 14px;
        align-self: start;
      }
      .brand {
        padding: 14px;
        border-radius: 22px;
        background: linear-gradient(160deg, rgba(105, 213, 255, 0.15), rgba(105, 213, 255, 0.02));
        border: 1px solid rgba(105, 213, 255, 0.24);
      }
      .brand-mark,
      .eyebrow,
      .rail-label,
      .metric-label,
      .section-label,
      .check-icon,
      th,
      .table-pill,
      .mini-pill,
      .status-pill {
        font-family: "IBM Plex Mono", monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .brand-mark {
        color: var(--cyan);
        font-size: 12px;
        margin-bottom: 12px;
      }
      .brand h1 {
        margin: 0;
        font: 700 30px/0.95 "Space Grotesk", sans-serif;
      }
      .brand p,
      .meta p,
      .link-stack a,
      .narrative,
      .subcopy,
      .check-card p,
      .helper,
      td,
      li,
      .note {
        color: var(--muted);
      }
      .meta,
      .link-stack,
      .rail-box {
        margin-top: 16px;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.02);
      }
      .rail-label {
        color: var(--muted);
        font-size: 11px;
        margin-bottom: 8px;
      }
      .meta p,
      .helper,
      .subcopy,
      .note,
      td,
      li {
        line-height: 1.55;
      }
      .link-stack a {
        display: block;
        text-decoration: none;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid transparent;
        transition: border-color .18s ease, transform .18s ease, background .18s ease;
      }
      .link-stack a:hover {
        border-color: rgba(105, 213, 255, 0.24);
        background: rgba(105, 213, 255, 0.06);
        transform: translateX(2px);
      }
      .main {
        min-width: 0;
      }
      .hero {
        border-radius: 32px;
        padding: 28px;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
        gap: 20px;
        overflow: hidden;
        position: relative;
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto -160px -180px auto;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(105, 213, 255, 0.18), transparent 70%);
        filter: blur(24px);
        pointer-events: none;
      }
      .eyebrow {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        color: var(--cyan);
        font-size: 11px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(105, 213, 255, 0.2);
        background: rgba(105, 213, 255, 0.08);
      }
      .hero h2,
      .meter-card h2,
      .panel h3 {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
      }
      .hero h2 {
        margin-top: 18px;
        font-size: clamp(42px, 5vw, 72px);
        line-height: 0.92;
        max-width: 10ch;
      }
      .narrative {
        margin: 16px 0 20px;
        max-width: 66ch;
        font-size: 16px;
      }
      .status-row,
      .mini-pill-row,
      .metric-grid,
      .detail-grid,
      .round-grid,
      .stats-grid {
        display: grid;
        gap: 14px;
      }
      .status-row {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .status-pill,
      .mini-pill,
      .table-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--line);
        padding: 7px 11px;
        font-size: 11px;
      }
      .status-pill.ok { color: var(--green); border-color: rgba(111, 240, 186, 0.28); background: rgba(111, 240, 186, 0.08); }
      .status-pill.warn { color: var(--amber); border-color: rgba(247, 191, 102, 0.28); background: rgba(247, 191, 102, 0.08); }
      .status-pill.fail { color: var(--red); border-color: rgba(255, 127, 127, 0.28); background: rgba(255, 127, 127, 0.08); }
      .metric-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 22px;
      }
      .stat {
        border-radius: 22px;
        padding: 18px;
        background: linear-gradient(180deg, rgba(12, 25, 40, 0.95), rgba(7, 17, 27, 0.88));
      }
      .metric-label {
        color: var(--muted);
        font-size: 11px;
      }
      .metric-value {
        margin-top: 10px;
        font: 700 28px/1 "Space Grotesk", sans-serif;
      }
      .metric-foot {
        margin-top: 8px;
        font-size: 13px;
        color: var(--muted);
      }
      .metric-value.cyan { color: var(--cyan); }
      .metric-value.green { color: var(--green); }
      .metric-value.amber { color: var(--amber); }
      .metric-value.red { color: var(--red); }
      .meter-card {
        border-radius: 28px;
        padding: 22px;
        background: linear-gradient(180deg, rgba(14, 33, 51, 0.98), rgba(9, 20, 32, 0.96));
      }
      .meter-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }
      .meter-total {
        font: 700 30px/1 "Space Grotesk", sans-serif;
        color: var(--cyan);
      }
      .meter-bar,
      .remaining-track {
        overflow: hidden;
        border-radius: 999px;
      }
      .meter-bar {
        display: flex;
        height: 16px;
        margin-top: 18px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(130, 167, 197, 0.16);
      }
      .segment { height: 100%; }
      .segment.principal { background: linear-gradient(90deg, #14243a, #19314e); }
      .segment.released { background: linear-gradient(90deg, #15636c, #26b0b8); }
      .segment.spent { background: linear-gradient(90deg, #a96920, #f7bf66); }
      .meter-legend {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
        color: var(--muted);
        font-size: 13px;
      }
      .meter-legend strong { color: var(--text); display: block; margin-top: 4px; }
      .swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
      }
      .swatch.principal { background: #29496f; }
      .swatch.released { background: #39d4dd; }
      .swatch.spent { background: #f7bf66; }
      .swatch.remaining { background: #6ff0ba; }
      .meter-note {
        margin-top: 16px;
        color: var(--muted);
        line-height: 1.6;
      }
      .remaining-track {
        margin-top: 16px;
        height: 7px;
        background: rgba(255, 255, 255, 0.05);
      }
      .remaining-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #59dca7, #8cf2c5);
      }
      .detail-grid {
        grid-template-columns: 1.1fr 0.9fr;
        margin-top: 18px;
      }
      .panel {
        border-radius: 26px;
        padding: 22px;
      }
      .panel h3 {
        font-size: 24px;
      }
      .section-label {
        color: var(--muted);
        font-size: 11px;
        margin-bottom: 10px;
      }
      .mini-pill-row {
        grid-template-columns: repeat(auto-fit, minmax(170px, max-content));
        margin-top: 14px;
      }
      .mini-pill {
        color: var(--muted);
        background: rgba(255,255,255,0.03);
      }
      .list-block {
        margin: 14px 0 0;
        padding-left: 18px;
      }
      .list-block li + li { margin-top: 8px; }
      .data-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .data-card {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.02);
      }
      .data-card .k {
        font-family: "IBM Plex Mono", monospace;
        text-transform: uppercase;
        font-size: 11px;
        color: var(--muted);
      }
      .data-card .v {
        margin-top: 8px;
        font-size: 16px;
        color: var(--text);
        word-break: break-word;
      }
      .check-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .check-card {
        border-radius: 20px;
        padding: 16px;
      }
      .check-card.ok { background: linear-gradient(180deg, rgba(16, 50, 44, 0.68), rgba(9, 28, 28, 0.92)); }
      .check-card.fail { background: linear-gradient(180deg, rgba(70, 27, 27, 0.72), rgba(35, 13, 13, 0.92)); border-color: rgba(255, 127, 127, 0.2); }
      .check-topline {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .check-icon { font-size: 11px; }
      .check-card.ok .check-icon { color: var(--green); }
      .check-card.fail .check-icon { color: var(--red); }
      .check-label {
        font: 600 16px/1.3 "IBM Plex Sans", sans-serif;
        flex: 1;
      }
      .receipt-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .receipt-box {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.03);
      }
      .receipt-box .k { color: var(--muted); font-family: "IBM Plex Mono", monospace; font-size: 11px; text-transform: uppercase; }
      .receipt-box .v { margin-top: 7px; }
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
      th { font-size: 11px; color: var(--muted); }
      .mono {
        font-family: "IBM Plex Mono", monospace;
        font-size: 12px;
      }
      .table-pill {
        color: var(--cyan);
        background: rgba(105, 213, 255, 0.08);
        border-color: rgba(105, 213, 255, 0.18);
      }
      @media (max-width: 1220px) {
        .shell { grid-template-columns: 1fr; }
        .rail { position: static; }
      }
      @media (max-width: 1080px) {
        .hero,
        .detail-grid { grid-template-columns: 1fr; }
        .metric-grid,
        .status-row,
        .receipt-grid,
        .check-grid,
        .data-grid,
        .meter-legend { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 720px) {
        .shell { width: min(100vw - 18px, 100%); }
        .hero,
        .panel,
        .rail,
        .meter-card,
        .stat,
        .check-card { border-radius: 22px; }
        .metric-grid,
        .status-row,
        .receipt-grid,
        .check-grid,
        .data-grid,
        .meter-legend { grid-template-columns: 1fr; }
        .hero h2 { max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <aside class="rail">
        <div class="brand">
          <div class="brand-mark">X Layer Human Track</div>
          <h1>${escapeHtml(productName)}</h1>
          <p>
            A treasury owner sets a safe spending budget for the agent while the rest of the wallet stays protected.
          </p>
        </div>

        <div class="meta">
          <div class="rail-label">Operator Posture</div>
          <p><strong>${escapeHtml(titleCase(packet.operator.mode))}</strong></p>
          <p>Last command: ${escapeHtml(titleCase(packet.operator.lastCommand))}</p>
          <p>${escapeHtml(packet.operator.note ?? "No operator note")}</p>
        </div>

        <div class="rail-box">
          <div class="rail-label">Submission Surface</div>
          <p>Network: X Layer mainnet (${packet.execution.chainId})</p>
          <p>Consumer: ${escapeHtml(packet.charter.consumerName)}</p>
          <p>Spend asset: ${escapeHtml(packet.charter.spendAsset)}</p>
          <p>Yield mode: ${escapeHtml(titleCase(packet.charter.yieldSourceMode))}</p>
        </div>

        <div class="link-stack">
          <div class="rail-label">What To Inspect</div>
          <a href="#boundary">Capital boundary and released yield</a>
          <a href="#request">Latest request and route decision</a>
          <a href="#checks">Pre-execution policy checks</a>
          <a href="#receipt">Receipt and transaction evidence</a>
          <a href="#rounds">Recent charter rounds</a>
        </div>
      </aside>

      <main class="main">
        <section class="hero">
          <div>
            <div class="eyebrow">Agent Budget Guard · Live Console</div>
            <h2>Give the agent a budget, not the whole wallet.</h2>
            <p class="narrative">
              This console shows a simple product rule: the treasury owner keeps control of principal, releases a smaller operating budget, and the agent can only act inside that budget. Every request is checked before money moves.
            </p>
            <div class="status-row">
              <span class="status-pill ok">Wallet scope ${escapeHtml(packet.charter.walletAddress ? "Scoped" : "Shared Flow")}</span>
              <span class="status-pill ${executionTone}">Execution ${escapeHtml(titleCase(packet.execution.status))}</span>
              <span class="status-pill ${packet.decision.outcome === "approve" ? "ok" : packet.decision.outcome === "resize" ? "warn" : "fail"}">Decision ${escapeHtml(titleCase(packet.decision.outcome))}</span>
              <span class="status-pill ${packet.receipt.capitalLayer === "yield" ? "ok" : packet.receipt.capitalLayer === "none" ? "warn" : "fail"}">Capital ${escapeHtml(titleCase(packet.receipt.capitalLayer))}</span>
            </div>
            <div class="metric-grid">
              <article class="stat">
                <div class="metric-label">Principal Floor</div>
                <div class="metric-value cyan">${formatUsd(packet.charter.principalFloorUsd)}</div>
                <div class="metric-foot">Untouchable capital threshold</div>
              </article>
              <article class="stat">
                <div class="metric-label">Released Yield</div>
                <div class="metric-value green">${formatUsd(packet.yieldLedger.releasedYieldUsd)}</div>
                <div class="metric-foot">Budget the agent can use</div>
              </article>
              <article class="stat">
                <div class="metric-label">Remaining Budget</div>
                <div class="metric-value amber">${formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</div>
                <div class="metric-foot">Yield still available today</div>
              </article>
              <article class="stat">
                <div class="metric-label">Latest Request</div>
                <div class="metric-value ${packet.decision.outcome === "block" ? "red" : "cyan"}">${formatUsd(packet.decision.finalNotionalUsd)}</div>
                <div class="metric-foot">${escapeHtml(packet.request.assetPair)} via ${escapeHtml(packet.request.venueHint)}</div>
              </article>
            </div>
          </div>
          ${renderCapitalMeter(packet)}
        </section>

        <section class="detail-grid">
          <article class="panel" id="boundary">
            <div class="section-label">Owner Settings</div>
            <h3>The rules the owner gave the agent</h3>
            <p class="subcopy">
              This is the product setup: how much money stays locked, how much budget is released, and what the agent is allowed to do with it.
            </p>
            <div class="data-grid">
              <div class="data-card"><div class="k">Charter Id</div><div class="v mono">${escapeHtml(packet.charter.charterId)}</div></div>
              <div class="data-card"><div class="k">Lease Id</div><div class="v mono">${escapeHtml(packet.lease.leaseId)}</div></div>
              <div class="data-card"><div class="k">Consumer</div><div class="v">${escapeHtml(packet.charter.consumerName)}</div></div>
              <div class="data-card"><div class="k">Wallet</div><div class="v mono">${escapeHtml(packet.charter.walletAddress ?? "Shared Agentic Wallet flow")}</div></div>
              <div class="data-card"><div class="k">Yield Source</div><div class="v">${escapeHtml(packet.charter.yieldSourceName)}</div></div>
              <div class="data-card"><div class="k">Budget Ceiling</div><div class="v">${formatUsd(packet.lease.dailyBudgetUsd)} daily / ${formatUsd(packet.lease.perTxUsd)} per tx</div></div>
            </div>
            <ul class="list-block">
              <li>Allowed assets: ${packet.lease.allowedAssets.map(escapeHtml).join(", ")}</li>
              <li>Allowed protocols: ${packet.lease.allowedProtocols.map(escapeHtml).join(", ")}</li>
              <li>Actions: ${packet.lease.allowedActions.map(escapeHtml).join(", ")}</li>
              <li>Trust requirements: reason ${packet.lease.trustRequirements.reasonRequired ? "required" : "optional"}, proof ${packet.lease.trustRequirements.proofRequired ? "required" : "optional"}</li>
            </ul>
          </article>

          <article class="panel" id="request">
            <div class="section-label">Agent Request</div>
            <h3>What the agent tried to do</h3>
            <p class="subcopy">The agent asked to trade or rebalance. The system then decided whether the request should go through as-is, be resized, or be stopped.</p>
            <div class="data-grid">
              <div class="data-card"><div class="k">Action</div><div class="v">${escapeHtml(titleCase(packet.request.action))}</div></div>
              <div class="data-card"><div class="k">Asset Pair</div><div class="v">${escapeHtml(packet.request.assetPair)}</div></div>
              <div class="data-card"><div class="k">Requested</div><div class="v">${formatUsd(packet.request.notionalUsd)}</div></div>
              <div class="data-card"><div class="k">Final Notional</div><div class="v">${formatUsd(packet.decision.finalNotionalUsd)}</div></div>
            </div>
            <div class="mini-pill-row">${renderRouteHints(packet)}</div>
            <p class="helper"><strong>Reason:</strong> ${escapeHtml(packet.request.reason)}</p>
            <p class="helper"><strong>Rationale:</strong> ${escapeHtml(packet.decision.rationale)}</p>
          </article>
        </section>

        <section class="detail-grid">
          <article class="panel" id="checks">
            <div class="section-label">Decision Engine</div>
            <h3>Checks before any money moves</h3>
            <p class="subcopy">This is the core product behavior. The request does not get to spend first. Budget, route quality, scope, and safety are checked first.</p>
            <div class="check-grid">${renderChecks(packet)}</div>
          </article>

          <article class="panel" id="receipt">
            <div class="section-label">Result</div>
            <h3>What actually happened</h3>
            <p class="subcopy">After the checks, the system records the outcome. You can see whether the request was blocked, resized, simulated, or actually broadcasted onchain.</p>
            <div class="receipt-grid">
              <div class="receipt-box"><div class="k">Execution Status</div><div class="v">${escapeHtml(titleCase(packet.execution.status))}</div></div>
              <div class="receipt-box"><div class="k">Capital Layer</div><div class="v">${escapeHtml(titleCase(packet.receipt.capitalLayer))}</div></div>
              <div class="receipt-box"><div class="k">Spent</div><div class="v">${formatUsd(packet.receipt.spentUsd)}</div></div>
              <div class="receipt-box"><div class="k">24H Spent</div><div class="v">${formatUsd(packet.usage.spent24hUsd)}</div></div>
              <div class="receipt-box"><div class="k">Receipts 24H</div><div class="v">${escapeHtml(String(packet.usage.receiptCount24h))}</div></div>
              <div class="receipt-box"><div class="k">Round Timestamp</div><div class="v">${escapeHtml(packet.generatedAt)}</div></div>
            </div>
            <div class="data-grid">
              <div class="data-card"><div class="k">Tx Hash</div><div class="v mono">${escapeHtml(packet.execution.txHash ?? "none")}</div></div>
              <div class="data-card"><div class="k">Explorer</div><div class="v">${packet.execution.explorerUrl ? `<a href="${escapeHtml(packet.execution.explorerUrl)}">Open transaction</a>` : "No explorer link for this round"}</div></div>
            </div>
            <p class="helper"><strong>Execution note:</strong> ${escapeHtml(packet.execution.note)}</p>
            <p class="helper"><strong>Receipt note:</strong> ${escapeHtml(packet.receipt.note)}</p>
          </article>
        </section>

        <section class="panel" id="rounds" style="margin-top: 18px;">
          <div class="section-label">History</div>
          <h3>Recent agent budget events</h3>
          <p class="subcopy">The product keeps a rolling history so the owner can inspect how often the agent tried to use budget, what the system decided, and which requests reached onchain broadcast.</p>
          <table>
            <thead>
              <tr>
                <th>Generated</th>
                <th>Outcome</th>
                <th>Tx</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>${renderRounds(index)}</tbody>
          </table>
        </section>
      </main>
    </div>
  </body>
</html>`;
}

export function writeProofDashboardHtml(input: { packet: ProofPacket; index: RoundArtifactIndexEntry[]; outputPath: string }): string {
  fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
  fs.writeFileSync(input.outputPath, `${buildProofDashboardHtml(input)}\n`);
  return input.outputPath;
}
