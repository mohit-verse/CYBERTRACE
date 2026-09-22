/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Plus, Download } from 'lucide-react';

export default function ReportsPage({ params }: { params: { caseId: string } }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [params.caseId]);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/cases/${params.caseId}/reports`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch reports');
      setReports(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(requestAiNarrative: boolean) {
    try {
      setGenerating(true);
      const res = await fetch(`/api/cases/${params.caseId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestAiNarrative })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to generate report');
      fetchReports();
    } catch (err: any) {
      alert(`Error generating report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigative Reports</h1>
          <p className="text-muted-foreground mt-1">Generate immutable case dossiers and intelligence summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleGenerate(false)} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Standard Report
          </Button>
          <Button onClick={() => handleGenerate(true)} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            AI Dossier Report
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-destructive text-sm font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Name</TableHead>
              <TableHead>AI Narrative</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead className="text-right">Export</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {r.name}
                  </div>
                </TableCell>
                <TableCell>
                  {r.aiNarrative ? (
                    <Badge variant="default" className="bg-purple-500/15 text-purple-500 hover:bg-purple-500/25">Included</Badge>
                  ) : (
                    <Badge variant="secondary">None</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/cases/${params.caseId}/reports/${r.id}/json`} download>
                        <Download className="w-4 h-4 mr-2" /> JSON
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/cases/${params.caseId}/reports/${r.id}/pdf`} download>
                        <Download className="w-4 h-4 mr-2" /> PDF
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No reports generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
