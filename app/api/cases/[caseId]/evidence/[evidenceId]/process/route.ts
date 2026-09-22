import { NextRequest, NextResponse } from 'next/server';
import { investigationPipeline } from '@/lib/investigation';

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string, evidenceId: string } }
) {
  try {
    const { caseId, evidenceId } = params;

    // Execute the complete end-to-end deterministic pipeline
    await investigationPipeline.runFullPipeline(caseId, evidenceId);

    return NextResponse.json({
      success: true,
      data: {
        evidenceId,
        processingStatus: 'PROCESSED'
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Processing error:', err);
    return NextResponse.json({
      success: false,
      error: { code: 'PROCESSING_ERROR', message: err.message || 'Failed to process evidence' }
    }, { status: 500 });
  }
}
