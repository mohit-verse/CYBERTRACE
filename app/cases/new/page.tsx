/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create case');
      }

      // Redirect to the new case dashboard
      router.push(`/cases/${data.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/cases">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Investigation</h1>
          <p className="text-muted-foreground mt-1">Open a new case file in the CYBERTRACE system.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Case Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number <span className="text-destructive">*</span></Label>
              <Input 
                id="caseNumber" 
                placeholder="e.g. CASE-2026-002" 
                required 
                value={formData.caseNumber}
                onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">A unique identifier for this investigation.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input 
                id="title" 
                placeholder="Brief title of the investigation" 
                required 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide initial context or background for this case..." 
                className="h-32"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" asChild>
              <Link href="/cases">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Case
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
