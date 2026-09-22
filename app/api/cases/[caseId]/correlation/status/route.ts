import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const caseId = params.caseId;
    const c = await prisma.case.findUnique({ where: { id: caseId } });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    const relCount = await prisma.relationship.count({ where: { caseId } });
    const findCount = await prisma.investigationFinding.count({ where: { caseId } });

    return NextResponse.json({ success: true, data: { relationships: relCount, findings: findCount } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'STATUS_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
