/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, Search, FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function EvidenceVault({ params }: { params: { caseId: string } }) {
  const { caseId } = params;
  
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [artifactType, setArtifactType] = useState('BANK_TRANSACTION');
  const [processError, setProcessError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvidence();
  }, [caseId]);

  const fetchEvidence = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/evidence`);
      const data = await res.json();
      if (data.success) {
        setEvidenceFiles(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProcessError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artifactType', artifactType);
      
      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await res.json();
      if (result.success) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchEvidence();
      } else {
        setProcessError(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      setProcessError('Upload failed due to network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Vault</h1>
          <p className="text-muted-foreground mt-1">Upload and process digital artifacts.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                disabled={uploading}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={artifactType} onValueChange={setArtifactType} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDR">CDR</SelectItem>
                  <SelectItem value="IPDR">IPDR</SelectItem>
                  <SelectItem value="BANK_TRANSACTION">Bank Transaction</SelectItem>
                  <SelectItem value="UPI_TRANSACTION">UPI Transaction</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="ANDROID_LOG">Android Log</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full md:w-auto">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Ingest & Parse
                </>
              )}
            </Button>
          </div>
          {processError && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-md">
              {processError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search evidence..." className="pl-9 h-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : evidenceFiles.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {e.originalFilename}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{e.artifactType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={e.processingStatus === 'PROCESSED' ? 'default' : e.processingStatus === 'FAILED' ? 'destructive' : 'secondary'} className={e.processingStatus === 'PROCESSED' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' : ''}>
                    {e.processingStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {new Date(e.uploadedAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/cases/${caseId}/evidence/${e.id}`}>
                      View
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && evidenceFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No evidence found. Upload a file above to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
