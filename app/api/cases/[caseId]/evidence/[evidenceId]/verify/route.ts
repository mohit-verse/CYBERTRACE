import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { retrieveEvidence } from '@/lib/evidence/storage';
import { calculateSha256 } from '@/lib/evidence/hash';

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string, evidenceId: string } }
) {
  try {
    const { caseId, evidenceId } = params;

    const evidence = await prisma.evidenceFile.findUnique({
      where: {
        id: evidenceId,
        caseId, // Enforce case isolation
      }
    });

    if (!evidence) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Evidence not found' } }, { status: 404 });
    }

    if (!evidence.storagePath) {
      return NextResponse.json({ success: false, error: { code: 'STORAGE_ERROR', message: 'Evidence storage path is missing' } }, { status: 500 });
    }

    let calculatedSha256: string;
    try {
      const buffer = await retrieveEvidence(evidence.storagePath);
      calculatedSha256 = await calculateSha256(buffer);
    } catch {
      // Failed to retrieve or hash
      await prisma.evidenceFile.update({
        where: { id: evidenceId },
        data: { integrityStatus: 'ERROR' }
      });
      return NextResponse.json({ success: false, error: { code: 'VERIFICATION_FAILED', message: 'Failed to retrieve or read evidence file' } }, { status: 500 });
    }

    const isMatch = calculatedSha256 === evidence.sha256;
    const newStatus = isMatch ? 'VERIFIED' : 'MISMATCH';

    await prisma.evidenceFile.update({
      where: { id: evidenceId },
      data: {
        integrityStatus: newStatus
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        evidenceId: evidence.id,
        storedSha256: evidence.sha256,
        calculatedSha256,
        integrityStatus: newStatus,
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify evidence' } }, { status: 500 });
  }
}
