import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string, evidenceId: string } }
) {
  try {
    const { caseId, evidenceId } = params;

    const evidence = await prisma.evidenceFile.findUnique({
      where: {
        id: evidenceId,
        caseId,
      }
    });

    if (!evidence) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Evidence not found' } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        evidenceId: evidence.id,
        integrityStatus: evidence.integrityStatus,
        processingStatus: evidence.processingStatus,
        processedAt: evidence.processedAt,
        errorMessage: evidence.errorMessage,
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve evidence status' } }, { status: 500 });
  }
}
