/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, ArrowLeft, Loader2, Sparkles, Send } from 'lucide-react';

export default function AskInvestigationPage({ params }: { params: { caseId: string } }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const suggestedQuestions = [
    "Why is the highest-risk entity considered high risk?",
    "Explain the transaction flow.",
    "What evidence links the main entities?",
    "Summarize the key findings."
  ];

  async function handleAsk(e?: React.FormEvent, predefinedQuery?: string) {
    if (e) e.preventDefault();
    const q = predefinedQuery || query;
    if (!q.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResponse(null);
      if (predefinedQuery) setQuery(predefinedQuery);

      const res = await fetch(`/api/cases/${params.caseId}/investigation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to get AI response');
      
      setResponse(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Investigation Assistant</h1>
          <p className="text-muted-foreground mt-1">Ask questions about the case data, powered by Sarvam AI.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/cases/${params.caseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Case
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-primary" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleAsk(e)} className="flex gap-4">
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Which entities are linked to the fraudulent transactions?"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {loading ? 'Analyzing...' : 'Ask'}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 mt-4">
            {suggestedQuestions.map((sq, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleAsk(undefined, sq)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {sq}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-destructive text-sm font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {response.answer}
              </div>
            </div>
            {response.references && response.references.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Sources Referenced</h4>
                <div className="flex flex-wrap gap-2">
                  {response.references.map((ref: string) => (
                    <Badge key={ref} variant="outline" className="font-mono text-xs">{ref}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
