import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string, entityId: string } }) {
  try {
    const { caseId, entityId } = params;
    
    const assessment = await prisma.riskAssessment.findFirst({
      where: { caseId, entityId },
      include: { factors: true }
    });

    if (!assessment) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Risk assessment not found for entity' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'RISK_FETCH_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
