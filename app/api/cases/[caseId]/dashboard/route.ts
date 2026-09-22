import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Severity } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const caseId = params.caseId;
    const c = await prisma.case.findUnique({ where: { id: caseId } });
    if (!c) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    // Evidence KPIs
    const evidenceList = await prisma.evidenceFile.findMany({ where: { caseId } });
    const processedEvidence = evidenceList.filter(e => e.processingStatus === 'PROCESSED').length;
    const processingEvidence = evidenceList.filter(e => e.processingStatus === 'PROCESSING').length;
    const failedEvidence = evidenceList.filter(e => e.processingStatus === 'FAILED').length;
    const verifiedEvidence = evidenceList.filter(e => e.integrityStatus === 'VERIFIED').length;
    const mismatchEvidence = evidenceList.filter(e => e.integrityStatus === 'MISMATCH').length;
    const pendingEvidence = evidenceList.filter(e => e.integrityStatus === 'PENDING').length;

    // Investigation KPIs
    const entityCount = await prisma.entity.count({ where: { caseId } });
    const relationshipCount = await prisma.relationship.count({ where: { caseId } });
    const transactionCount = await prisma.transaction.count({ where: { caseId } });
    
    const findings = await prisma.investigationFinding.findMany({ 
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const findingCount = await prisma.investigationFinding.count({ where: { caseId } });

    // Risk KPIs
    const risks = await prisma.riskAssessment.findMany({
      where: { caseId },
      include: { entity: true, factors: true },
      orderBy: { score: 'desc' }
    });
    const highRiskEntities = risks.filter(r => r.severity === Severity.HIGH);
    const criticalRiskEntities = risks.filter(r => r.severity === Severity.CRITICAL);

    // Recent Timeline
    const timeline = await prisma.timelineEvent.findMany({
      where: { caseId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        evidence: {
          total: evidenceList.length,
          processed: processedEvidence,
          processing: processingEvidence,
          failed: failedEvidence,
          verified: verifiedEvidence,
          mismatch: mismatchEvidence,
          pending: pendingEvidence
        },
        investigation: {
          entityCount,
          relationshipCount,
          transactionCount,
          findingCount
        },
        findings: findings,
        risk: {
          highRiskCount: highRiskEntities.length,
          criticalRiskCount: criticalRiskEntities.length,
          topRisks: risks.slice(0, 5) // Send top 5 to UI
        },
        timeline
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } }, { status: 500 });
  }
}
