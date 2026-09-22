import prisma from '@/lib/db';
import { InvestigationContext, QueryCategory } from './types';

export class ContextBuilder {
  async buildContext(caseId: string, query: string, category: QueryCategory): Promise<InvestigationContext> {
    // Basic context bounds (limit records to prevent huge prompts)
    const limit = 50;

    const caseInfo = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, caseNumber: true, title: true, status: true, description: true }
    });

    if (!caseInfo) {
      throw new Error('Case not found');
    }

    // Always fetch top findings and risks
    const findings = await prisma.investigationFinding.findMany({
      where: { caseId },
      take: 20
    });

    const riskAssessments = await prisma.riskAssessment.findMany({
      where: { caseId },
      include: { factors: true, entity: true },
      orderBy: { score: 'desc' },
      take: 20
    });

    // Fetch conditional context based on category
    let entities: unknown[] = [];
    let relationships: unknown[] = [];
    let transactions: unknown[] = [];
    let timeline: unknown[] = [];
    let evidenceFiles: unknown[] = [];

    if (category === 'ENTITY' || category === 'GENERAL_INVESTIGATION' || category === 'RISK') {
      entities = await prisma.entity.findMany({ where: { caseId }, take: limit });
    }

    if (category === 'RELATIONSHIP' || category === 'GENERAL_INVESTIGATION' || category === 'TRANSACTION') {
      relationships = await prisma.relationship.findMany({ where: { caseId }, include: { evidence: true }, take: limit });
    }

    if (category === 'TRANSACTION' || category === 'TIMELINE' || category === 'GENERAL_INVESTIGATION') {
      transactions = await prisma.transaction.findMany({ where: { caseId }, orderBy: { transactionTimestamp: 'asc' }, take: limit });
    }

    if (category === 'TIMELINE') {
      timeline = await prisma.timelineEvent.findMany({ where: { caseId }, orderBy: { timestamp: 'asc' }, take: limit });
    }

    if (category === 'EVIDENCE' || category === 'GENERAL_INVESTIGATION') {
      evidenceFiles = await prisma.evidenceFile.findMany({ where: { caseId }, take: limit });
    }

    return {
      caseInfo,
      entities,
      relationships,
      transactions,
      riskAssessments,
      findings,
      timeline,
      evidenceFiles
    };
  }

  classifyQuery(query: string): QueryCategory {
    const q = query.toLowerCase();
    if (q.includes('risk') || q.includes('score') || q.includes('severity')) return 'RISK';
    if (q.includes('transaction') || q.includes('transfer') || q.includes('flow') || q.includes('money')) return 'TRANSACTION';
    if (q.includes('link') || q.includes('connect') || q.includes('relationship')) return 'RELATIONSHIP';
    if (q.includes('time') || q.includes('when') || q.includes('between')) return 'TIMELINE';
    if (q.includes('evidence') || q.includes('file') || q.includes('document')) return 'EVIDENCE';
    if (q.includes('entity') || q.includes('account') || q.includes('phone') || q.includes('imei')) return 'ENTITY';
    if (q.includes('summarize') || q.includes('summary') || q.includes('finding')) return 'CASE_SUMMARY';
    
    return 'GENERAL_INVESTIGATION';
  }
}

export const contextBuilder = new ContextBuilder();
