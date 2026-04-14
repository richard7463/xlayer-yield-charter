import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { ProofPacket, RoundArtifactIndexEntry } from '@/lib/types';

const dataDir = path.resolve(process.cwd(), 'data', 'yield-charter');

export const getSiteData = cache((): { packet: ProofPacket; rounds: RoundArtifactIndexEntry[] } => {
  const packetPath = path.join(dataDir, 'live-proof-latest.json');
  const indexPath = path.join(dataDir, 'index.json');

  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8')) as ProofPacket;
  const rounds = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as RoundArtifactIndexEntry[];

  return { packet, rounds };
});
