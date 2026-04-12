import fs from "node:fs";
import path from "node:path";
import { YieldCharterPolicy } from "../core/types.js";

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function chartersDir(baseDir: string): string {
  return path.resolve(baseDir, "charter");
}

export function activeCharterPath(baseDir: string): string {
  return path.resolve(chartersDir(baseDir), "active-charter.json");
}

export function readActiveCharter(baseDir: string): YieldCharterPolicy | null {
  const filePath = activeCharterPath(baseDir);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as YieldCharterPolicy;
}

export function writeActiveCharter(baseDir: string, charter: YieldCharterPolicy): string {
  const filePath = activeCharterPath(baseDir);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(charter, null, 2)}\n`);
  return filePath;
}
