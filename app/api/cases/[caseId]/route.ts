import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const c = await prisma.case.findUnique({
      where: { id: params.caseId }
    });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: c });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
