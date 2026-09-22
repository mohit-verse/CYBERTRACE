import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const caseId = params.caseId;
    const c = await prisma.case.findUnique({ where: { id: caseId } });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    const assessments = await prisma.riskAssessment.findMany({
      where: { caseId },
      include: { factors: true }
    });

    return NextResponse.json({ success: true, data: assessments });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'RISK_FETCH_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
