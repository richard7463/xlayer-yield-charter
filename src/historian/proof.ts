import { ProofPacket } from "../core/types.js";

export function createProofPacket(packet: ProofPacket): ProofPacket {
  return {
    ...packet,
    generatedAt: packet.generatedAt || new Date().toISOString()
  };
}

export function summarizeProofPacket(packet: ProofPacket): string {
  return [
    `product=${packet.product}`,
    `operator=${packet.operator.mode}`,
    `charter=${packet.charter.charterId}`,
    `lease=${packet.lease.leaseId}`,
    `outcome=${packet.decision.outcome}`,
    `zone=${packet.decision.trustZone}`,
    `notional=${packet.decision.finalNotionalUsd}`,
    `yield_remaining=${packet.yieldLedger.remainingYieldBudgetUsd.toFixed(2)}`,
    `tx=${packet.execution.txHash ?? "none"}`
  ].join(" | ");
}
