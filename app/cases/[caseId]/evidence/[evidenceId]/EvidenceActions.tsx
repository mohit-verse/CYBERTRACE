/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EvidenceActions({ caseId, evidenceId, processingStatus, integrityStatus }: { caseId: string, evidenceId: string, processingStatus: string, integrityStatus: string }) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/evidence/${evidenceId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Verification failed');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/evidence/${evidenceId}/process`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Processing failed');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying || integrityStatus === 'VERIFIED'}>
          {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          {integrityStatus === 'VERIFIED' ? 'Verified' : 'Verify Integrity'}
        </Button>
        <Button variant="default" size="sm" onClick={handleProcess} disabled={processing || processingStatus === 'PROCESSED' || processingStatus === 'PROCESSING'}>
          {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cpu className="w-4 h-4 mr-2" />}
          {processingStatus === 'PROCESSED' ? 'Processed' : 'Process Evidence'}
        </Button>
      </div>
      {error && <div className="text-xs text-destructive mt-1">{error}</div>}
    </div>
  );
}
