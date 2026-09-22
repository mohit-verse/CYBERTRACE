/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { allRules } from './rules';
import { CandidateRelationship } from './types';
import { findingsGenerator } from './findings';

export class CorrelationEngine {
  async runCorrelation(caseId: string): Promise<any> {
    const stats = { recordsEvaluated: 0, candidatesGenerated: 0, acceptedRelationships: 0, rejectedCandidates: 0, findingsGenerated: 0 };
    
    // 1. Evaluate rules on all normalized evidence records
    const records = await prisma.evidenceRecord.findMany({ where: { evidenceFile: { caseId } } });
    
    const candidates: CandidateRelationship[] = [];
    for (const record of records) {
      stats.recordsEvaluated++;
      for (const rule of allRules) {
        const generated = rule.evaluate(record);
        candidates.push(...generated);
      }
    }
    stats.candidatesGenerated = candidates.length;

    // 2. Fetch all entities for this case to map canonical values to entity IDs
    const caseEntities = await prisma.entity.findMany({ where: { caseId } });
    const entityMap = new Map<string, string>(); // key: type:canonicalValue -> entityId
    for (const e of caseEntities) {
      entityMap.set(`${e.type}:${e.canonicalValue}`, e.id);
    }

    // 3. Create relationships
    for (const candidate of candidates) {
      const sourceId = entityMap.get(`${candidate.sourceEntityType}:${candidate.sourceCanonicalValue}`);
      const targetId = entityMap.get(`${candidate.targetEntityType}:${candidate.targetCanonicalValue}`);

      if (!sourceId || !targetId) {
        stats.rejectedCandidates++;
        continue;
      }

      // Check if relationship already exists
      let relationship = await prisma.relationship.findFirst({
        where: {
          caseId,
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          relationshipType: candidate.relationshipType
        },
        include: { evidence: true }
      });

      if (!relationship) {
        // Create it
        relationship = await prisma.relationship.create({
          data: {
            caseId,
            sourceEntityId: sourceId,
            targetEntityId: targetId,
            relationshipType: candidate.relationshipType,
            confidence: candidate.confidence,
            reason: candidate.reason,
            metadata: { ruleId: candidate.ruleId, timestamp: candidate.timestamp }
          },
          include: { evidence: true }
        });
        stats.acceptedRelationships++;
      }

      // Link evidence if not already linked
      const hasEvidence = relationship.evidence.some(e => e.evidenceRecordId === candidate.evidenceRecordId);
      if (!hasEvidence) {
        await prisma.relationshipEvidence.create({
          data: {
            relationshipId: relationship.id,
            evidenceRecordId: candidate.evidenceRecordId
          }
        });
      }
    }

    // 4. Create Transaction models from Bank/UPI parsing
    for (const record of records) {
      const data: any = (record.normalizedData as any) || {};
      if (record.recordType === 'BANK_TRANSACTION' || record.recordType === 'UPI_TRANSACTION') {
        const existingTx = await prisma.transaction.findFirst({
          where: { caseId, sourceEvidenceRecordId: record.id }
        });
        
        if (!existingTx) {
          const sAcc = data.sourceAccount ? entityMap.get(`BANK_ACCOUNT:${data.sourceAccount}`) : null;
          const dAcc = data.destinationAccount ? entityMap.get(`BANK_ACCOUNT:${data.destinationAccount}`) : null;

          await prisma.transaction.create({
            data: {
              caseId,
              sourceEvidenceRecordId: record.id,
              transactionReference: data.transactionReference || null,
              amount: data.amount || null,
              transactionTimestamp: data.timestamp ? new Date(data.timestamp) : null,
              channel: record.recordType === 'BANK_TRANSACTION' ? 'BANK' : 'UPI',
              sourceAccountEntityId: sAcc,
              destinationAccountEntityId: dAcc
            }
          });
        }
      }
    }

    // 5. Generate Findings
    const findings = await findingsGenerator.generateFindings(caseId);
    for (const f of findings) {
      const exists = await prisma.investigationFinding.findFirst({
        where: { caseId, findingType: f.findingType, title: f.title }
      });
      if (!exists) {
        await prisma.investigationFinding.create({
          data: {
            caseId,
            findingType: f.findingType,
            severity: f.severity,
            title: f.title,
            description: f.description,
            status: 'NEW'
          }
        });
        stats.findingsGenerated++;
      }
    }

    return stats;
  }
}

export const correlationEngine = new CorrelationEngine();
