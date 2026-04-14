import { ProofPage } from '@/components/proof-page';
import { getSiteData } from '@/lib/site-data';

export default function ProofRoutePage() {
  const { packet, rounds } = getSiteData();
  return <ProofPage packet={packet} rounds={rounds} />;
}
