'use client';

import React, { useState } from 'react';
import InvestigationGraph from '@/components/investigation/InvestigationGraph';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, ArrowRightLeft } from 'lucide-react';

export default function CaseGraphPage({ params }: { params: { caseId: string } }) {
  const [viewMode, setViewMode] = useState<'graph' | 'flow'>('graph');

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity & Relationship Graph</h1>
          <p className="text-muted-foreground mt-1">Visualize connections between people, devices, accounts and transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={viewMode === 'graph' ? 'default' : 'outline'}
            onClick={() => setViewMode('graph')}
          >
            <Network className="w-4 h-4 mr-2" />
            Graph View
          </Button>
          <Button 
            variant={viewMode === 'flow' ? 'default' : 'outline'}
            onClick={() => setViewMode('flow')}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transaction Flow
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-6 bg-muted/50 border rounded-md px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs font-medium">Person</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium">Phone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs font-medium">Bank Account</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs font-medium">UPI</span>
          </div>
        </div>
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden relative">
        <InvestigationGraph caseId={params.caseId} />
      </Card>
    </div>
  );
}
