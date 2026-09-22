/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import prisma from '@/lib/db';
import { Link } from 'next-view-transitions';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ShieldAlert, Network, ArrowRight, FileText, AlertTriangle } from 'lucide-react';

export default async function CaseDashboard({ params }: { params: { caseId: string } }) {
  const { caseId } = params;

  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      evidenceFiles: { orderBy: { uploadedAt: 'desc' } },
      entities: true,
      relationships: true,
      transactions: true,
      findings: true,
      riskAssessments: true,
    }
  });

  if (!caseData) return notFound();

  // Stats
  const processedEvidence = caseData.evidenceFiles.filter(e => e.processingStatus === 'PROCESSED').length;
  const highRiskEntities = caseData.riskAssessments.filter(r => r.score >= 50).length;
  const criticalFindings = caseData.findings.filter(f => f.severity === 'CRITICAL').length;
  const highFindings = caseData.findings.filter(f => f.severity === 'HIGH').length;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{caseData.title}</h1>
            <Badge variant={caseData.status === 'ACTIVE' ? 'default' : 'secondary'} className={caseData.status === 'ACTIVE' ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" : ""}>
              {caseData.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">{caseData.caseNumber}</span>
          </div>
          <p className="mt-4 max-w-2xl text-muted-foreground">{caseData.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/cases/${caseData.id}/reports`}>Generate Report</Link>
          </Button>
          <Button asChild>
            <Link href={`/cases/${caseData.id}/investigation`}>Ask AI</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseData.entities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Extracted from evidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Actors</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highRiskEntities}</div>
            <p className="text-xs text-muted-foreground mt-1">Score ≥ 50</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedEvidence} / {caseData.evidenceFiles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseData.relationships.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Correlations found</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Recent Evidence */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Evidence</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/cases/${caseData.id}/evidence`}>
                View Vault
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.evidenceFiles.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{e.originalFilename}</div>
                      <div className="text-xs text-muted-foreground">{e.artifactType}</div>
                    </div>
                  </div>
                  <Badge variant={e.processingStatus === 'PROCESSED' ? 'outline' : 'secondary'} className={e.processingStatus === 'PROCESSED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : ''}>
                    {e.processingStatus}
                  </Badge>
                </div>
              ))}
              {caseData.evidenceFiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No evidence uploaded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Findings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Key Findings</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.findings.slice(0, 5).map(f => (
                <div key={f.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium">{f.title}</span>
                    <Badge variant={f.severity === 'CRITICAL' ? 'destructive' : f.severity === 'HIGH' ? 'destructive' : 'secondary'} className={f.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-500 hover:bg-orange-500/25' : ''}>
                      {f.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
                </div>
              ))}
              {caseData.findings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No findings detected yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
