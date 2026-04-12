import crypto from "node:crypto";
import { RuntimeEnv } from "../config/env.js";
import { YieldCharterPolicy } from "../core/types.js";

export function issueYieldCharterFromEnv(env: RuntimeEnv, walletAddress?: string): YieldCharterPolicy {
  return {
    charterId: `charter_${crypto.randomUUID()}`,
    issuedAt: new Date().toISOString(),
    status: "active",
    ownerLabel: env.CHARTER_OWNER_LABEL,
    consumerName: env.LEASE_CONSUMER_NAME,
    walletAddress,
    principalFloorUsd: env.CHARTER_PRINCIPAL_FLOOR_USD,
    releasedYieldUsd: env.CHARTER_RELEASED_YIELD_USD,
    spendAsset: env.LEASE_DEFAULT_BASE_ASSET,
    yieldSourceMode: env.CHARTER_SOURCE_MODE,
    yieldSourceName: env.CHARTER_YIELD_SOURCE_NAME,
    notes: [env.CHARTER_NOTES, env.LEASE_NOTES]
  };
}
