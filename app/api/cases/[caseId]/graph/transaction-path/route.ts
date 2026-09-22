import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { graphQueries } from '@/lib/graph';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const caseId = params.caseId;
    const c = await prisma.case.findUnique({ where: { id: caseId } });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    const data = await graphQueries.getTransactionPath(caseId);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'GRAPH_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
