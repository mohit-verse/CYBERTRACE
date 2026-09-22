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
        caseId, // Ensures case isolation
      }
    });

    if (!evidence) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Evidence not found' } }, { status: 404 });
    }

    const recordCount = await prisma.evidenceRecord.count({ where: { evidenceFileId: evidenceId } });

    return NextResponse.json({
      success: true,
      data: {
        id: evidence.id,
        originalFilename: evidence.originalFilename,
        mimeType: evidence.mimeType,
        fileSize: evidence.fileSize,
        artifactType: evidence.artifactType,
        sha256: evidence.sha256,
        integrityStatus: evidence.integrityStatus,
        processingStatus: evidence.processingStatus,
        uploadedAt: evidence.uploadedAt,
        processedAt: evidence.processedAt,
        recordCount,
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
