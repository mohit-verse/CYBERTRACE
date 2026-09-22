/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from '@/lib/db';
import { StructuredReport } from './types';

export class ReportContextBuilder {
  async build(caseId: string, reportId: string): Promise<StructuredReport> {
    const c = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        evidenceFiles: true,
        entities: {
          include: {
            riskAssessments: { include: { factors: true } }
          }
        },
        relationships: {
          include: {
            evidence: true
          }
        },
        transactions: {
          orderBy: { transactionTimestamp: 'asc' }
        },
        findings: true,
        timelineEvents: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!c) throw new Error('Case not found');

    const metadata = {
      reportId,
      caseId,
      version: '1.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CYBERTRACE',
      status: 'GENERATED'
    };

    const caseSummary = {
      caseNumber: c.caseNumber,
      title: c.title,
      description: c.description,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };

    const evidenceSummary = c.evidenceFiles.map(e => ({
      id: e.id,
      originalFilename: e.originalFilename,
      artifactType: e.artifactType,
      mimeType: e.mimeType,
      fileExtension: e.fileExtension,
      fileSize: e.fileSize,
      sha256: e.sha256,
      integrityStatus: e.integrityStatus,
      processingStatus: e.processingStatus,
      uploadedAt: e.uploadedAt.toISOString(),
      processedAt: e.processedAt?.toISOString() || null
    }));

    const entities = c.entities.map(e => {
      const highestRisk = [...e.riskAssessments].sort((a, b) => b.score - a.score)[0];
      return {
        id: e.id,
        type: e.type,
        canonicalValue: e.canonicalValue,
        displayValue: e.displayValue,
        riskScore: highestRisk ? highestRisk.score : 0,
        riskSeverity: highestRisk ? highestRisk.severity : 'LOW'
      };
    });

    const primeInvestigationEntities = entities
      .filter(e => e.riskSeverity === 'CRITICAL' || e.riskSeverity === 'HIGH')
      .map(e => ({
        entity: e,
        reason: `Associated with ${e.riskSeverity} risk assessment.`
      }));

    const relationships = c.relationships.map(r => ({
      id: r.id,
      sourceEntityId: r.sourceEntityId,
      targetEntityId: r.targetEntityId,
      relationshipType: r.relationshipType,
      confidence: r.confidence,
      reason: r.reason,
      evidenceReferences: r.evidence.map(ev => ev.evidenceRecordId)
    }));

    const communicationLinks = relationships.filter(r => ['CALLED', 'CONNECTED_FROM', 'ASSOCIATED_WITH'].includes(r.relationshipType));
    const deviceNetworkCorrelations = relationships.filter(r => ['USES', 'HAS', 'LINKED_TO'].includes(r.relationshipType) && !communicationLinks.includes(r));
    
    const transactionFlow = c.transactions.map(t => ({
      id: t.id,
      transactionReference: t.transactionReference,
      sourceAccountEntityId: t.sourceAccountEntityId,
      destinationAccountEntityId: t.destinationAccountEntityId,
      amount: t.amount,
      currency: t.currency,
      transactionTimestamp: t.transactionTimestamp?.toISOString() || null,
      channel: t.channel,
      description: t.description
    }));

    const riskAssessments = c.entities.flatMap(e => 
      e.riskAssessments.map(ra => ({
        entityId: e.id,
        score: ra.score,
        severity: ra.severity,
        calculatedAt: ra.calculatedAt.toISOString(),
        factors: ra.factors.map(f => ({
          factorType: f.factorType,
          weight: f.weight,
          description: f.description
        }))
      }))
    );

    const findings = c.findings.map(f => ({
      id: f.id,
      findingType: f.findingType,
      severity: f.severity,
      title: f.title,
      description: f.description,
      timestamp: f.createdAt.toISOString()
    }));

    const timeline = c.timelineEvents.map(t => ({
      timestamp: t.timestamp.toISOString(),
      eventType: t.eventType,
      title: t.title,
      description: t.description,
      primaryEntityId: t.primaryEntityId
    }));

    const dataQuality: string[] = [];
    c.evidenceFiles.forEach(e => {
      if (e.processingStatus === 'FAILED') dataQuality.push(`Evidence file ${e.originalFilename} failed processing.`);
      if (e.integrityStatus === 'PENDING') dataQuality.push(`Integrity verification is pending for ${e.originalFilename}.`);
      if (e.integrityStatus === 'MISMATCH') dataQuality.push(`CRITICAL: Integrity MISMATCH for ${e.originalFilename}.`);
    });
    if (dataQuality.length === 0) dataQuality.push('No notable data quality limitations identified.');

    const contradictoryEvidence: string[] = ['No structured contradictory evidence recorded.'];

    const investigationLeads: string[] = [];
    if (findings.some(f => f.findingType === 'MULTI_HOP_TRANSACTION')) {
      investigationLeads.push('Review the entities associated with the multi-hop transaction flow.');
    }
    if (deviceNetworkCorrelations.length > 0) {
      investigationLeads.push('Review the shared device/network evidence for potential correlation overlap.');
    }

    return {
      metadata,
      caseSummary,
      executiveSummary: {
        evidenceCount: evidenceSummary.length,
        entityCount: entities.length,
        relationshipCount: relationships.length,
        transactionCount: transactionFlow.length,
        findingsCount: findings.length,
        criticalRiskCount: entities.filter(e => e.riskSeverity === 'CRITICAL').length,
        highRiskCount: entities.filter(e => e.riskSeverity === 'HIGH').length
      },
      evidenceSummary,
      entities,
      primeInvestigationEntities,
      relationships,
      transactionFlow,
      communicationLinks,
      deviceNetworkCorrelations,
      riskAssessments,
      findings,
      investigationLeads,
      timeline,
      dataQuality,
      contradictoryEvidence
    };
  }
}
export const reportContextBuilder = new ReportContextBuilder();
