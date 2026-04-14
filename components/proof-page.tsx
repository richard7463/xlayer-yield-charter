import Link from 'next/link';
import { formatCompactUsd, formatUsd, ratio, shortHash, titleCase } from '@/lib/format';
import type { ProofPacket, RoundArtifactIndexEntry } from '@/lib/types';

type ProofPageProps = {
  packet: ProofPacket;
  rounds: RoundArtifactIndexEntry[];
};

export function ProofPage({ packet, rounds }: ProofPageProps) {
  const total = Math.max(packet.treasury.totalUsd, packet.charter.principalFloorUsd + packet.yieldLedger.releasedYieldUsd, 0.01);
  const principalWidth = `${ratio(packet.charter.principalFloorUsd, total)}%`;
  const releasedWidth = `${ratio(packet.yieldLedger.releasedYieldUsd, total)}%`;
  const spentWidth = `${ratio(packet.yieldLedger.spentYieldUsd, total)}%`;
  const remainingWidth = `${ratio(packet.yieldLedger.remainingYieldBudgetUsd, total)}%`;

  const flow = [
    ['Protect', 'Owner locks the treasury', `${formatUsd(packet.charter.principalFloorUsd)} is marked as principal. The agent cannot spend below this floor.`],
    ['Release', 'Owner releases yield budget', `${formatUsd(packet.yieldLedger.releasedYieldUsd)} is released as agent operating budget.`],
    ['Request', 'Agent asks to act', `${packet.charter.consumerName} requested ${formatUsd(packet.request.notionalUsd)} for ${packet.request.fromToken} -> ${packet.request.toToken}.`],
    ['Decide', 'Guard resizes or blocks', `The guard returned ${titleCase(packet.decision.outcome)} and allowed ${formatUsd(packet.decision.finalNotionalUsd)}.`],
    ['Receipt', 'Every action leaves proof', `${titleCase(packet.execution.status)} on X Layer with receipt ${shortHash(packet.execution.txHash)}.`]
  ] as const;

  return (
    <main className="proof-shell">
      <aside className="proof-sidebar card-surface-dark">
        <div className="proof-brand card-surface-darkSoft">
          <span className="eyebrow">X Layer Human Track</span>
          <h1>X Layer Yield Charter</h1>
          <p>A treasury owner sets a safe spending budget for the agent while the rest of the wallet stays protected.</p>
        </div>

        <div className="proof-sidebarBox">
          <span className="section-label">Operator Posture</span>
          <strong>{titleCase(packet.operator.mode)}</strong>
          <p>Last command: {titleCase(packet.operator.lastCommand)}</p>
          <p>{packet.operator.note ?? 'No operator note'}</p>
        </div>

        <div className="proof-sidebarBox">
          <span className="section-label">Current Wallet</span>
          <p>Network: X Layer mainnet ({packet.execution.chainId})</p>
          <p>Consumer: {packet.charter.consumerName}</p>
          <p>Spend asset: {packet.charter.spendAsset}</p>
          <p>Agent budget left: {formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</p>
        </div>

        <nav className="proof-nav proof-sidebarBox">
          <span className="section-label">Navigation</span>
          <Link href="/">Submission Surface</Link>
          <a href="#how">What This Page Does</a>
          <a href="#owner">Owner Setup</a>
          <a href="#request">Agent Request</a>
          <a href="#decision">Decision Engine</a>
          <a href="#receipt">Receipt</a>
          <a href="#history">History</a>
        </nav>
      </aside>

      <section className="proof-main">
        <section className="proof-hero card-surface-dark">
          <div>
            <div className="eyebrow">Functional Dashboard · Live Console</div>
            <h2>Agent Budget Control Center</h2>
            <p>This page answers four questions for a human owner: what money is protected, what the agent tried to do, what the guard allowed, and where the X Layer receipt is.</p>
            <div className="chip-row">
              <span className="status-chip ok">Wallet Scope {packet.charter.walletAddress ? 'Scoped' : 'Shared Flow'}</span>
              <span className={`status-chip ${packet.execution.status === 'broadcasted' ? 'ok' : 'warn'}`}>Execution {titleCase(packet.execution.status)}</span>
              <span className={`status-chip ${packet.decision.outcome === 'resize' ? 'warn' : packet.decision.outcome === 'approve' ? 'ok' : 'fail'}`}>Decision {titleCase(packet.decision.outcome)}</span>
              <span className={`status-chip ${packet.receipt.capitalLayer === 'yield' ? 'ok' : 'fail'}`}>Capital {titleCase(packet.receipt.capitalLayer)}</span>
            </div>
            <div className="metric-grid proof-metrics">
              <article className="metric-card card-surface-darkSoft">
                <span className="metric-label">Owner Setup</span>
                <strong className="metric-value cyan">{formatUsd(packet.charter.principalFloorUsd)}</strong>
                <p>Principal locked. Released: {formatUsd(packet.yieldLedger.releasedYieldUsd)}</p>
              </article>
              <article className="metric-card card-surface-darkSoft">
                <span className="metric-label">Agent Request</span>
                <strong className="metric-value green">{packet.request.fromToken} -&gt; {packet.request.toToken}</strong>
                <p>Requested {formatUsd(packet.request.notionalUsd)} via {packet.request.venueHint}</p>
              </article>
              <article className="metric-card card-surface-darkSoft">
                <span className="metric-label">Guard Decision</span>
                <strong className="metric-value amber">{formatUsd(packet.decision.finalNotionalUsd)}</strong>
                <p>{titleCase(packet.decision.outcome)} against live budget rules</p>
              </article>
              <article className="metric-card card-surface-darkSoft">
                <span className="metric-label">Receipt</span>
                <strong className="metric-value green">{packet.execution.status === 'broadcasted' ? 'Live Tx' : titleCase(packet.execution.status)}</strong>
                <p>{shortHash(packet.execution.txHash)}</p>
              </article>
            </div>
          </div>

          <aside className="capital-panel dark">
            <span className="eyebrow">Treasury Rules</span>
            <h3>Agent budget vs locked treasury</h3>
            <strong className="capital-total">{formatCompactUsd(packet.treasury.totalUsd)}</strong>
            <div className="capital-bar dark">
              <span className="capital principal" style={{ width: principalWidth }} />
              <span className="capital released" style={{ width: releasedWidth }} />
              <span className="capital spent" style={{ width: spentWidth }} />
            </div>
            <div className="capital-statGrid dark">
              <div><span className="dot principal" />Principal floor<strong>{formatUsd(packet.charter.principalFloorUsd)}</strong></div>
              <div><span className="dot released" />Yield released<strong>{formatUsd(packet.yieldLedger.releasedYieldUsd)}</strong></div>
              <div><span className="dot spent" />Yield spent<strong>{formatUsd(packet.yieldLedger.spentYieldUsd)}</strong></div>
              <div><span className="dot remaining" />Yield remaining<strong>{formatUsd(packet.yieldLedger.remainingYieldBudgetUsd)}</strong></div>
            </div>
            <p className="capital-note">The agent only gets the released budget. If a request is too large or outside policy, it is resized or blocked before any X Layer execution path is reached.</p>
            <div className="remaining-track dark"><div className="remaining-fill" style={{ width: remainingWidth }} /></div>
          </aside>
        </section>

        <section id="how" className="card-surface-dark section-card">
          <span className="section-label">What This Page Does</span>
          <h3>A control surface for agent spending</h3>
          <p>X Layer Yield Charter is not a yield dashboard. It is a governance layer for autonomous agents. The owner releases a small yield budget, the agent asks to spend it, the guard checks the request, and only then can execution reach X Layer.</p>
          <div className="flow-grid">
            {flow.map(([label, title, body]) => (
              <article key={label} className="flow-card card-surface-darkSoft">
                <span className="section-label">{label}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="owner" className="card-surface-dark section-card">
          <span className="section-label">Owner Setup</span>
          <h3>Set the agent&apos;s money rules</h3>
          <div className="detail-grid">
            <article className="detail-card dark"><span>Lock principal</span><strong>{formatUsd(packet.charter.principalFloorUsd)}</strong></article>
            <article className="detail-card dark"><span>Release budget</span><strong>{formatUsd(packet.yieldLedger.releasedYieldUsd)}</strong></article>
            <article className="detail-card dark"><span>Per-tx cap</span><strong>{formatUsd(packet.lease.perTxUsd)}</strong></article>
            <article className="detail-card dark"><span>Daily cap</span><strong>{formatUsd(packet.lease.dailyBudgetUsd)}</strong></article>
            <article className="detail-card dark"><span>Allowed assets</span><strong>{packet.lease.allowedAssets.join(', ')}</strong></article>
            <article className="detail-card dark"><span>Allowed routes</span><strong>{packet.lease.allowedProtocols.join(', ')}</strong></article>
          </div>
        </section>

        <section className="proof-splitGrid">
          <article id="request" className="card-surface-dark section-card">
            <span className="section-label">Agent Request</span>
            <h3>Review what the agent wants to do</h3>
            <div className="detail-grid">
              <article className="detail-card dark"><span>Agent</span><strong>{packet.charter.consumerName}</strong></article>
              <article className="detail-card dark"><span>Action</span><strong>{titleCase(packet.request.action)}</strong></article>
              <article className="detail-card dark"><span>From / To</span><strong>{packet.request.fromToken} -&gt; {packet.request.toToken}</strong></article>
              <article className="detail-card dark"><span>Venue</span><strong>{packet.request.venueHint}</strong></article>
              <article className="detail-card dark"><span>Requested Size</span><strong>{formatUsd(packet.request.notionalUsd)}</strong></article>
              <article className="detail-card dark detail-span2"><span>Reason</span><strong>{packet.request.reason}</strong></article>
            </div>
          </article>

          <article id="decision" className="card-surface-dark section-card">
            <span className="section-label">Decision Engine</span>
            <h3>See what the product allowed</h3>
            <div className="decision-box">
              <div><span>Agent asked for</span><strong>{formatUsd(packet.request.notionalUsd)}</strong></div>
              <div><span>Product allowed</span><strong>{formatUsd(packet.decision.finalNotionalUsd)}</strong></div>
              <div><span>Decision</span><strong>{titleCase(packet.decision.outcome)}</strong></div>
              <div><span>Why</span><strong>{packet.decision.rationale}</strong></div>
            </div>
          </article>
        </section>

        <section id="receipt" className="proof-splitGrid">
          <article className="card-surface-dark section-card">
            <span className="section-label">Policy Checklist</span>
            <h3>Why the decision was safe</h3>
            <div className="check-grid">
              {packet.checks.map((check) => (
                <article key={check.id} className={`check-card ${check.ok ? 'ok' : 'fail'}`}>
                  <div>
                    <span className="section-label">{check.ok ? 'Pass' : 'Block'}</span>
                    <strong>{check.label}</strong>
                  </div>
                  <p>{check.note}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card-surface-dark section-card">
            <span className="section-label">Receipt</span>
            <h3>Confirm what actually happened</h3>
            <div className="detail-grid">
              <article className="detail-card dark"><span>Execution Status</span><strong>{titleCase(packet.execution.status)}</strong></article>
              <article className="detail-card dark"><span>Capital Layer</span><strong>{titleCase(packet.receipt.capitalLayer)}</strong></article>
              <article className="detail-card dark"><span>Spent</span><strong>{formatUsd(packet.receipt.spentUsd)}</strong></article>
              <article className="detail-card dark"><span>24h Spent</span><strong>{formatUsd(packet.usage.spent24hUsd)}</strong></article>
              <article className="detail-card dark"><span>Receipts 24h</span><strong>{String(packet.usage.receiptCount24h)}</strong></article>
              <article className="detail-card dark"><span>Round Timestamp</span><strong>{packet.generatedAt}</strong></article>
              <article className="detail-card dark detail-span2"><span>Tx Hash</span><strong>{packet.execution.txHash ?? 'none'}</strong></article>
              <article className="detail-card dark detail-span2"><span>Explorer</span><strong>{packet.execution.explorerUrl ?? 'No explorer link for this round'}</strong></article>
            </div>
          </article>
        </section>

        <section id="history" className="card-surface-dark section-card table-section">
          <span className="section-label">History</span>
          <h3>Recent agent budget events</h3>
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
      </section>
    </main>
  );
}
