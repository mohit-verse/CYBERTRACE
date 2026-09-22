/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: cases });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseNumber, title, description } = body;
    
    if (!caseNumber || !title) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Case number and title are required' } }, { status: 400 });
    }

    const existing = await prisma.case.findUnique({ where: { caseNumber } });
    if (existing) {
      return NextResponse.json({ success: false, error: { code: 'CONFLICT', message: 'Case number already exists' } }, { status: 409 });
    }

    const newCase = await prisma.case.create({
      data: { caseNumber, title, description, status: 'ACTIVE' }
    });

    return NextResponse.json({ success: true, data: newCase });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
