import { SubmissionPage } from '@/components/submission-page';
import { getSiteData } from '@/lib/site-data';

export default function SubmissionRoutePage() {
  const { packet, rounds } = getSiteData();
  return <SubmissionPage packet={packet} rounds={rounds} />;
}
