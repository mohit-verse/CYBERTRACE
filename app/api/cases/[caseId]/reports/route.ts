/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { reportBuilder } from '@/lib/reports';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params;
    const reports = await prisma.report.findMany({
      where: { caseId },
      orderBy: { generatedAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: reports });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred while processing the report request' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params;
    const caseExists = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseExists) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }
    const body = await req.json().catch(() => ({}));
    const requestAiNarrative = !!body.requestAiNarrative;

    // Create a pending report record
    const report = await prisma.report.create({
      data: {
        caseId,
        reportType: 'INVESTIGATIVE_BRIEF',
        format: 'JSON_PDF',
        status: 'GENERATING'
      }
    });

    try {
      const { json, pdfBuffer } = await reportBuilder.generate(caseId, report.id, requestAiNarrative);
      
      // We store the JSON in the DB metadata for easy retrieval in MVP,
      // In production this would be S3. The PDF is generated on the fly from the JSON, 
      // or we can store it. For MVP, we will store the structured JSON in metadata, and PDF can be regenerated or base64.
      // Actually, storing large JSON in metadata is fine for MVP.
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'GENERATED',
          metadata: JSON.parse(json)
        }
      });
      return NextResponse.json({ success: true, data: report });
    } catch (generationError: any) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'FAILED',
          metadata: { error: generationError.message }
        }
      });
      throw generationError;
    }
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred while processing the report request' } }, { status: 500 });
  }
}
