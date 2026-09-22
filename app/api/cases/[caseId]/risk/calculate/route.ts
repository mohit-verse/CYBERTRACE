import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { riskEngine } from '@/lib/risk';

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const caseId = params.caseId;
    const c = await prisma.case.findUnique({ where: { id: caseId } });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    const stats = await riskEngine.runRiskCalculation(caseId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'RISK_CALCULATION_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
