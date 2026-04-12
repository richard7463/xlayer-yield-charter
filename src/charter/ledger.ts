import { RuntimeEnv } from "../config/env.js";
import { LeaseReceipt, TreasurySnapshot, YieldCharterPolicy, YieldLedgerSnapshot } from "../core/types.js";

export function buildYieldLedger(input: {
  env: RuntimeEnv;
  charter: YieldCharterPolicy;
  treasury: TreasurySnapshot;
  receipts: LeaseReceipt[];
}): YieldLedgerSnapshot {
  const treasuryUsd = input.treasury.totalUsd || input.treasury.liquidUsd;
  const treasuryBufferUsd = Math.max(0, Number((treasuryUsd - input.charter.principalFloorUsd).toFixed(2)));
  const accruedYieldUsd = treasuryBufferUsd;
  const releasedYieldUsd = input.charter.yieldSourceMode === "treasury_buffer"
    ? treasuryBufferUsd
    : Math.min(input.charter.releasedYieldUsd, treasuryBufferUsd);
  const harvestedYieldUsd = releasedYieldUsd;
  const spentYieldUsd = Number(
    input.receipts
      .filter((receipt) => receipt.status === "broadcasted" && receipt.capitalLayer === "yield")
      .reduce((sum, receipt) => sum + receipt.spentUsd, 0)
      .toFixed(2)
  );
  const spendableYieldUsd = Math.max(0, Number((harvestedYieldUsd - spentYieldUsd).toFixed(2)));

  return {
    updatedAt: new Date().toISOString(),
    yieldSourceMode: input.charter.yieldSourceMode,
    yieldSourceName: input.charter.yieldSourceName,
    treasuryUsd,
    principalFloorUsd: input.charter.principalFloorUsd,
    treasuryBufferUsd,
    accruedYieldUsd,
    releasedYieldUsd: Number(releasedYieldUsd.toFixed(2)),
    harvestedYieldUsd: Number(harvestedYieldUsd.toFixed(2)),
    spentYieldUsd,
    spendableYieldUsd,
    remainingYieldBudgetUsd: spendableYieldUsd
  };
}
