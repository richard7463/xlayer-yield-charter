import path from "node:path";
import { readRuntimeEnvFromFiles } from "../src/config/env.js";
import { issueYieldCharterFromEnv } from "../src/charter/policy.js";
import { writeActiveCharter } from "../src/charter/store.js";
import { getSettlementAccountAddress } from "../src/treasury/xlayer.js";

const env = readRuntimeEnvFromFiles();
const walletAddress = env.XLAYER_TREASURY_ADDRESS || getSettlementAccountAddress(env);
const charter = issueYieldCharterFromEnv(env, walletAddress);
const filePath = writeActiveCharter(path.resolve(env.LEASE_DATA_DIR), charter);

console.log(`charter=${charter.charterId}`);
console.log(`consumer=${charter.consumerName}`);
console.log(`wallet=${charter.walletAddress ?? "unscoped"}`);
console.log(`principal_floor_usd=${charter.principalFloorUsd}`);
console.log(`released_yield_usd=${charter.releasedYieldUsd}`);
console.log(`path=${filePath}`);
