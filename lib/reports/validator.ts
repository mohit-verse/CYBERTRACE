/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { StructuredReport } from './types';

export class ReportValidator {
  validate(report: StructuredReport): void {
    if (!report.metadata.caseId) {
      throw new Error('Validation Failed: caseId is missing in report metadata');
    }

    const entityIds = new Set(report.entities.map(e => e.id));

    // Verify all relationships only reference existing entities
    report.relationships.forEach(r => {
      if (!entityIds.has(r.sourceEntityId) || !entityIds.has(r.targetEntityId)) {
        throw new Error(`Validation Failed: Relationship ${r.id} references non-existent entities`);
      }
    });

    // Verify all prime entities actually exist in entities list
    report.primeInvestigationEntities.forEach(p => {
      if (!entityIds.has(p.entity.id)) {
        throw new Error(`Validation Failed: Prime entity ${p.entity.id} does not exist in case entities`);
      }
    });

    // Verify transactions
    report.transactionFlow.forEach(t => {
      if (t.sourceAccountEntityId && !entityIds.has(t.sourceAccountEntityId)) {
        throw new Error(`Validation Failed: Transaction ${t.id} references missing source entity`);
      }
      if (t.destinationAccountEntityId && !entityIds.has(t.destinationAccountEntityId)) {
        throw new Error(`Validation Failed: Transaction ${t.id} references missing destination entity`);
      }
    });

    // Verify risk assessments
    report.riskAssessments.forEach(ra => {
      if (!entityIds.has(ra.entityId)) {
        throw new Error(`Validation Failed: Risk Assessment references missing entity ${ra.entityId}`);
      }
    });

    // Verify SHA256 presence
    report.evidenceSummary.forEach(e => {
      if (e.processingStatus === 'PROCESSED' && !e.sha256) {
        throw new Error(`Validation Failed: Evidence ${e.id} is PROCESSED but lacks SHA-256`);
      }
    });
  }
}
export const reportValidator = new ReportValidator();
