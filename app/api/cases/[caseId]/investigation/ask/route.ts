import { NextRequest, NextResponse } from 'next/server';
import { contextBuilder, getAIProvider } from '@/lib/ai';

export const maxDuration = 60; // 60 seconds max for Vercel

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params;
    const body = await req.json();
    const query = body.query as string | undefined;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Query is required' } }, { status: 400 });
    }
    if (query.length > 2000) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Query is too long' } }, { status: 400 });
    }

    const category = contextBuilder.classifyQuery(query);
    const context = await contextBuilder.buildContext(caseId, query, category);
    
    const provider = getAIProvider();
    const response = await provider.generateResponse(context, query, category);

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error('AI Ask Error:', error);
    const message = (error as Error).message;
    // Controlled error response
    if (message.includes('AI credentials missing') || message.includes('Real AI provider not fully implemented')) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'AI_UNAVAILABLE', message: 'The AI investigation service is currently unavailable. The underlying forensic investigation data remains available.' } 
      }, { status: 503 });
    }

    if (message.includes('Rate limit exceeded') || message.includes('429')) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'The AI provider is currently rate limited due to high demand. Please wait a moment and try again.' } 
      }, { status: 429 });
    }

    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred while processing the investigation query' } }, { status: 500 });
  }
}
