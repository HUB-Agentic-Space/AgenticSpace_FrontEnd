import { Suspense } from 'react';
import VotingDetailContent from './VotingDetailContent';

export default function VotingDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center gap-2 text-slate-400"><span>Loading...</span></div>}>
      <VotingDetailContent />
    </Suspense>
  );
}
