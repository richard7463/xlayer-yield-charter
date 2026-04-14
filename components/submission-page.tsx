'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatUsd, shortHash, titleCase } from '@/lib/format';
import type { ProofPacket, RoundArtifactIndexEntry } from '@/lib/types';

type SubmissionPageProps = {
  packet: ProofPacket;
  rounds: RoundArtifactIndexEntry[];
};

type DemoScenario = {
  principalFloorUsd: number;
  releasedYieldUsd: number;
  spentYieldUsd: number;
  remainingYieldBudgetUsd: number;
  requestNotionalUsd: number;
  finalNotionalUsd: number;
  decisionOutcome: string;
  operatorMode: string;
  executionStatus: string;
  capitalLayer: string;
  requestPair: string;
  venueHint: string;
  reason: string;
  rationale: string;
  txHashShort: string;
  note: string;
};

function toneForDecision(value: string): 'ok' | 'warn' | 'fail' {
  const lower = value.toLowerCase();
  if (lower === 'approve' || lower === 'ready') return 'ok';
  if (lower === 'resize' || lower === 'waiting') return 'warn';
  return 'fail';
}

function toneForCapital(value: string): 'ok' | 'warn' | 'fail' {
  const lower = value.toLowerCase();
  if (lower === 'yield') return 'ok';
  if (lower === 'none') return 'fail';
  return 'warn';
}

function toneForExecution(value: string): 'ok' | 'warn' | 'fail' {
  const lower = value.toLowerCase();
  if (lower === 'broadcasted' || lower === 'live') return 'ok';
  if (lower === 'waiting' || lower === 'simulated') return 'warn';
  return 'fail';
}

function headlineForState(next: DemoScenario): string {
  if (next.operatorMode === 'Paused') return 'Agent paused';
  if (next.decisionOutcome === 'Ready') return 'Budget has been released';
  if (next.decisionOutcome === 'Resize') return 'Oversized request was resized';
  return 'Current live state';
}

export function SubmissionPage({ packet, rounds }: SubmissionPageProps) {
  const scenarios = useMemo(() => {
    const initial: DemoScenario = {
      principalFloorUsd: packet.charter.principalFloorUsd,
      releasedYieldUsd: packet.yieldLedger.releasedYieldUsd,
      spentYieldUsd: packet.yieldLedger.spentYieldUsd,
      remainingYieldBudgetUsd: packet.yieldLedger.remainingYieldBudgetUsd,
      requestNotionalUsd: packet.request.notionalUsd,
      finalNotionalUsd: packet.decision.finalNotionalUsd,
      decisionOutcome: titleCase(packet.decision.outcome),
      operatorMode: titleCase(packet.operator.mode),
      executionStatus: titleCase(packet.execution.status),
      capitalLayer: titleCase(packet.receipt.capitalLayer),
      requestPair: `${packet.request.fromToken} -> ${packet.request.toToken}`,
      venueHint: packet.request.venueHint,
      reason: packet.request.reason,
      rationale: packet.decision.rationale,
      txHashShort: shortHash(packet.execution.txHash),
      note: 'This is the live packet. Budget has already been released, the request was resized, and the execution reached X Layer.'
    };

    return {
      initial,
      budget: {
        ...initial,
        spentYieldUsd: 0,
        remainingYieldBudgetUsd: initial.releasedYieldUsd,
        requestNotionalUsd: 0,
        finalNotionalUsd: 0,
        decisionOutcome: 'Ready',
        operatorMode: 'Active',
        executionStatus: 'Waiting',
        capitalLayer: 'Yield',
        requestPair: 'No request yet',
        venueHint: 'Policy configured',
        reason: 'Owner released an operating budget while keeping principal locked.',
        rationale: 'The agent can operate, but only inside the lease limits and route rules.',
        txHashShort: 'none',
        note: 'Budget released. The agent now has a controlled spending lane while treasury principal stays locked.'
      },
      request: {
        ...initial,
        note: 'Oversized request detected. The product resized the spend to stay inside released yield and policy limits.'
      },
      paused: {
        ...initial,
        finalNotionalUsd: 0,
        decisionOutcome: 'Blocked',
        operatorMode: 'Paused',
        executionStatus: 'Blocked',
        capitalLayer: 'None',
        reason: 'Operator pause blocks all new spending requests.',
        rationale: 'The product stopped the request before the execution path because the human owner paused the agent.',
        txHashShort: 'none',
        note: 'Pause works as a hard stop. The agent can keep reporting, but it cannot spend until the owner resumes.'
      }
    };
  }, [packet]);

  const [state, setState] = useState<DemoScenario>(scenarios.initial);

  const capitalTotal = Math.max(state.principalFloorUsd + state.releasedYieldUsd, 0.01);
  const principalWidth = `${(state.principalFloorUsd / capitalTotal) * 100}%`;
  const releasedWidth = `${(state.releasedYieldUsd / capitalTotal) * 100}%`;
  const spentWidth = `${(state.spentYieldUsd / capitalTotal) * 100}%`;
  const remainingWidth = `${(state.remainingYieldBudgetUsd / capitalTotal) * 100}%`;

  return (
    <main className="submission-shell">
      <section className="submission-topbar card-surface">
        <div className="submission-brand">
          <span className="eyebrow">Build X · Human Track</span>
          <span className="submission-brandTitle">X Layer Yield Charter</span>
        </div>
        <div className="submission-toplinks">
          <Link href="/proof" className="chip-link">Open Proof Dashboard</Link>
          <Link href="/api/live-proof" className="chip-link">Open Latest JSON</Link>
          <span className={`status-chip ${toneForExecution(state.executionStatus)}`}>Execution {state.executionStatus}</span>
        </div>
      </section>

      <section className="submission-hero card-surface">
        <div className="submission-heroCopy">
          <div className="eyebrow">Agent Budget Guard · Treasury Product</div>
          <h1>Set an agent budget without giving it your treasury.</h1>
          <p>
            X Layer Yield Charter is a product for people who want agents to trade or rebalance with real funds,
            but do not want those agents to control the whole wallet. Use it in three moves: release a budget,
            let the agent request a trade, and inspect whether the system approved, resized, or blocked that request before money moved.
          </p>
          <div className="chip-row">
            <span className="status-chip ok">Network X Layer {packet.execution.chainId}</span>
            <span className="status-chip ok">Consumer {packet.charter.consumerName}</span>
            <span className={`status-chip ${toneForDecision(state.decisionOutcome)}`}>Decision {state.decisionOutcome}</span>
            <span className={`status-chip ${toneForCapital(state.capitalLayer)}`}>Capital {state.capitalLayer}</span>
          </div>
          <div className="metric-grid submission-metrics">
            <article className="metric-card card-surface-subtle">
              <span className="metric-label">Principal Floor</span>
              <strong className="metric-value cyan">{formatUsd(state.principalFloorUsd)}</strong>
              <p>Locked treasury base</p>
            </article>
            <article className="metric-card card-surface-subtle">
              <span className="metric-label">Released Yield</span>
              <strong className="metric-value green">{formatUsd(state.releasedYieldUsd)}</strong>
              <p>Operating budget made available</p>
            </article>
            <article className="metric-card card-surface-subtle">
              <span className="metric-label">Remaining Yield</span>
              <strong className="metric-value amber">{formatUsd(state.remainingYieldBudgetUsd)}</strong>
              <p>Still spendable this round</p>
            </article>
            <article className="metric-card card-surface-subtle">
              <span className="metric-label">Final Notional</span>
              <strong className={`metric-value ${state.finalNotionalUsd === 0 ? 'red' : 'cyan'}`}>{formatUsd(state.finalNotionalUsd)}</strong>
              <p>{state.finalNotionalUsd > 0 ? 'Policy-adjusted request size' : 'No spend allowed in this state'}</p>
            </article>
          </div>
        </div>

        <aside className="capital-panel">
          <span className="eyebrow">Treasury Rules</span>
          <h2>Your agent gets a budget. Your treasury keeps control.</h2>
          <p>{state.note}</p>
          <div className="capital-bar">
            <span className="capital principal" style={{ width: principalWidth }} />
            <span className="capital released" style={{ width: releasedWidth }} />
            <span className="capital spent" style={{ width: spentWidth }} />
          </div>
          <div className="capital-statGrid">
            <div><span className="dot principal" />Principal floor<strong>{formatUsd(state.principalFloorUsd)}</strong></div>
            <div><span className="dot released" />Yield released<strong>{formatUsd(state.releasedYieldUsd)}</strong></div>
            <div><span className="dot spent" />Yield spent<strong>{formatUsd(state.spentYieldUsd)}</strong></div>
            <div><span className="dot remaining" />Yield remaining<strong>{formatUsd(state.remainingYieldBudgetUsd)}</strong></div>
          </div>
          <div className="remaining-track"><div className="remaining-fill" style={{ width: remainingWidth }} /></div>
        </aside>
      </section>

      <section className="submission-threeGrid">
        <article className="card-surface section-card">
          <span className="section-label">Problem</span>
          <h3>Today you either trust the agent too much or babysit every move.</h3>
          <p>Most agent products stop at “connect wallet”. That is not enough for real money. Treasury owners need a clean way to say: the agent can use this budget, but not the rest.</p>
        </article>
        <article className="card-surface section-card">
          <span className="section-label">Product</span>
          <h3>A budget guard that sits in front of every agent action.</h3>
          <p>Yield Charter checks budget, route, protocol, counterparty, and risk before execution. The agent does not spend first and explain later.</p>
        </article>
        <article className="card-surface section-card">
          <span className="section-label">Who It Is For</span>
          <h3>Teams running trading, rebalancing, or ops agents with real funds.</h3>
          <p>If your agent needs to move money on X Layer, this product gives you a usable operating model: small budget, hard rules, and visible receipts.</p>
        </article>
      </section>

      <section className="submission-splitGrid">
        <article className="card-surface section-card">
          <span className="section-label">How To Use</span>
          <h3>Try the app in 30 seconds</h3>
          <p>This app is for a treasury owner. You do not hand the whole wallet to the agent. You release a smaller budget, let the agent ask to act, and the product enforces the money boundary for you.</p>
          <div className="step-stack">
            <div className="step-pill">1. Click <strong>Set Budget</strong> to release an operating budget while keeping principal locked.</div>
            <div className="step-pill">2. Click <strong>Run Agent Request</strong> to see how the guard resizes or approves spending.</div>
            <div className="step-pill">3. Click <strong>Pause Agent</strong> to watch the same request get blocked before execution.</div>
            <div className="step-pill">4. Click <strong>Reset Live State</strong> to go back to the current live packet.</div>
          </div>
          <ul className="hint-list">
            <li>This is not a generic wallet dashboard. It is a spending-control product for autonomous agents.</li>
            <li>The core promise is simple: the agent can spend released yield, but not treasury principal.</li>
            <li>Every allowed spend comes back with a receipt, a policy rationale, and tx proof.</li>
          </ul>
        </article>

        <article className="card-surface section-card">
          <span className="section-label">Interactive Demo</span>
          <h3>Click the controls and watch the policy react</h3>
          <p>{state.note}</p>
          <div className="action-grid">
            <button className="demo-button primary" onClick={() => setState(scenarios.budget)}>Set Budget</button>
            <button className="demo-button warn" onClick={() => setState(scenarios.request)}>Run Agent Request</button>
            <button className="demo-button danger" onClick={() => setState(scenarios.paused)}>Pause Agent</button>
            <button className="demo-button" onClick={() => setState(scenarios.initial)}>Reset Live State</button>
          </div>
          <div className="demo-kpiGrid">
            <article className="demo-kpi card-surface-subtle">
              <span className="metric-label">Operator Mode</span>
              <strong>{state.operatorMode}</strong>
              <p>Human owner posture</p>
            </article>
            <article className="demo-kpi card-surface-subtle">
              <span className="metric-label">Decision</span>
              <strong>{state.decisionOutcome}</strong>
              <p>Policy result before execution</p>
            </article>
            <article className="demo-kpi card-surface-subtle">
              <span className="metric-label">Execution</span>
              <strong>{state.executionStatus}</strong>
              <p>What happened onchain</p>
            </article>
          </div>
          <div className="callout-panel">
            <strong>{headlineForState(state)}</strong>
            <p>{state.rationale}</p>
          </div>
        </article>
      </section>

      <section className="card-surface section-card">
        <span className="section-label">Live Request State</span>
        <h3>What the agent is asking for right now</h3>
        <div className="detail-grid">
          <article className="detail-card"><span>Charter Id</span><strong>{packet.charter.charterId}</strong></article>
          <article className="detail-card"><span>Lease Id</span><strong>{packet.lease.leaseId}</strong></article>
          <article className="detail-card"><span>Request Pair</span><strong>{state.requestPair}</strong></article>
          <article className="detail-card"><span>Venue</span><strong>{state.venueHint}</strong></article>
          <article className="detail-card"><span>Requested</span><strong>{formatUsd(state.requestNotionalUsd)}</strong></article>
          <article className="detail-card"><span>Allowed</span><strong>{formatUsd(state.finalNotionalUsd)}</strong></article>
          <article className="detail-card detail-span2"><span>Reason</span><strong>{state.reason}</strong></article>
          <article className="detail-card"><span>Tx Hash</span><strong>{state.txHashShort}</strong></article>
        </div>
      </section>

      <section className="submission-threeGrid">
        <article className="card-surface section-card">
          <span className="section-label">A Clear User</span>
          <p>A treasury owner who wants agents to operate with real funds but not control the whole wallet.</p>
        </article>
        <article className="card-surface section-card">
          <span className="section-label">A Clear Action</span>
          <p>Set budget rules, let the agent act, and see every allowed, resized, or blocked request in one place.</p>
        </article>
        <article className="card-surface section-card">
          <span className="section-label">A Clear Trust Model</span>
          <p>The money boundary is enforced before execution, and every spend comes back with a receipt and tx proof.</p>
        </article>
      </section>

      <section className="card-surface section-card table-section">
        <span className="section-label">Audit Trail</span>
        <h3>Recent charter rounds</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Generated</th>
                <th>Outcome</th>
                <th>Tx</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {rounds.slice(0, 8).map((round) => (
                <tr key={`${round.generatedAt}-${round.requestId}`}>
                  <td>{round.generatedAt}</td>
                  <td><span className="table-pill">{titleCase(round.outcome)}</span></td>
                  <td className="mono-cell">{shortHash(round.txHash)}</td>
                  <td>{round.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
