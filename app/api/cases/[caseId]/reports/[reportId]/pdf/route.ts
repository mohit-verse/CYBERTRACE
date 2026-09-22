/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pdfReportGenerator } from '@/lib/reports/pdf';

export async function GET(req: NextRequest, { params }: { params: { caseId: string, reportId: string } }) {
  try {
    const { caseId, reportId } = params;
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report || report.caseId !== caseId) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } }, { status: 404 });
    }

    if (report.status !== 'GENERATED') {
      return NextResponse.json({ success: false, error: { code: 'BAD_STATE', message: 'Report is not fully generated' } }, { status: 400 });
    }

    // Reconstruct the PDF from the stored structured metadata
    const structuredData = report.metadata as any;
    const pdfBuffer = await pdfReportGenerator.generate(structuredData);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cybertrace-report-${reportId}.pdf"`
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
