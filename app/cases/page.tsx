import { Link } from 'next-view-transitions';
import prisma from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, Briefcase, Activity, FileText, ArrowRight } from 'lucide-react';

export default async function CasesPage() {
  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      evidenceFiles: true
    }
  });

  const activeCases = cases.filter(c => c.status === 'ACTIVE').length;
  const archivedCases = cases.filter(c => c.status === 'ARCHIVED').length;
  const totalEvidence = cases.reduce((acc, c) => acc + c.evidenceFiles.length, 0);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Investigations</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor cyber fraud cases.</p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="w-4 h-4 mr-2" />
            New Investigation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCases}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedCases}</div>
            <p className="text-xs text-muted-foreground">Closed cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvidence}</div>
            <p className="text-xs text-muted-foreground">Across all cases</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Search cases by ID, title, or description..." className="pl-9" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Title & Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.caseNumber}</TableCell>
                <TableCell className="max-w-md">
                  <div className="font-medium mb-1">{c.title || 'Untitled Case'}</div>
                  <div className="text-sm text-muted-foreground truncate">{c.description || 'No description provided.'}</div>
                </TableCell>
                <TableCell>
                  {c.status === 'ACTIVE' ? (
                    <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{c.evidenceFiles.length} files</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {c.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/cases/${c.id}`}>
                      Open
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {cases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No cases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
    </div>
  );
}
