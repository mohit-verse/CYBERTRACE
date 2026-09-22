/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ExternalLink, FileText, CheckCircle } from 'lucide-react';
import EvidenceActions from './EvidenceActions';

export default async function EvidenceDetail({ params }: { params: { caseId: string, evidenceId: string } }) {
  const { caseId, evidenceId } = params;

  const evidence = await prisma.evidenceFile.findUnique({
    where: { id: evidenceId, caseId },
    include: {
      records: { take: 10 }
    }
  });

  if (!evidence) return notFound();

  const sizeMb = evidence.fileSize ? (evidence.fileSize / (1024 * 1024)).toFixed(1) : 'Unknown';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{evidence.originalFilename}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{evidence.artifactType}</Badge>
              <span className="text-sm text-muted-foreground">{sizeMb} MB</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 ml-2">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
              <Badge variant={evidence.processingStatus === 'PROCESSED' ? 'default' : 'secondary'} className={evidence.processingStatus === 'PROCESSED' ? 'bg-emerald-500/10 text-emerald-500' : ''}>
                {evidence.processingStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <EvidenceActions 
            caseId={caseId} 
            evidenceId={evidenceId} 
            processingStatus={evidence.processingStatus} 
            integrityStatus={evidence.integrityStatus} 
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Original
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>Uploaded: {evidence.uploadedAt.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="parsed" className="w-full">
        <TabsList>
          <TabsTrigger value="parsed">Parsed Records</TabsTrigger>
          <TabsTrigger value="raw">Raw File View</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="parsed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Records (Sample)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidence.records.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          <pre className="text-xs bg-muted p-2 rounded-md max-w-[800px] overflow-x-auto text-muted-foreground">
                            {JSON.stringify(r.normalizedData, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                    {evidence.records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No records extracted.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="raw" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw File Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] bg-muted rounded-md border flex items-center justify-center text-muted-foreground text-sm">
                Raw preview not available for this file type.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cryptographic Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">SHA-256 Hash</div>
                <code className="text-xs bg-muted p-2 rounded-md block break-all text-muted-foreground">
                  {evidence.sha256}
                </code>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">MIME Type</div>
                  <div className="text-sm">{evidence.mimeType}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Storage Path</div>
                  <div className="text-sm font-mono text-xs truncate" title={evidence.storagePath || undefined}>{evidence.storagePath || 'Not stored'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
