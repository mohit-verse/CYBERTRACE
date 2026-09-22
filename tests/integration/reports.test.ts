/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/db';
import { reportContextBuilder } from '@/lib/reports/context-builder';
import { reportValidator } from '@/lib/reports/validator';
import { Severity, EntityType, ArtifactType } from '@prisma/client';

describe('Investigation Report Generator', () => {
  let caseId: string;
  let case2Id: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `REP-${Date.now()}`, title: 'Report Test' } });
      caseId = c.id;
      
      const c2 = await prisma.case.create({ data: { caseNumber: `REP-2-${Date.now()}`, title: 'Report Test 2' } });
      case2Id = c2.id;
      
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.report.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId: { in: [caseId, case2Id] } } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.investigationFinding.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.relationship.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.entity.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.case.deleteMany({ where: { id: { in: [caseId, case2Id] } } });
    }
  });

  it('builds isolated report context from canonical facts', async () => {
    if (!dbAvailable) return;

    // Insert Case 1 data
    await prisma.evidenceFile.create({ data: { id: 'rep-ev1', caseId, originalFilename: 'test.csv', storedFilename: 'test.csv', artifactType: ArtifactType.BANK_TRANSACTION, mimeType: 'text/csv', fileExtension: '.csv', fileSize: 100, sha256: 'deadbeef123', storagePath: 'path1', processingStatus: 'PROCESSED', integrityStatus: 'VERIFIED' }});
    
    const e1 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC1' } });
    await prisma.riskAssessment.create({ data: { caseId, entityId: e1.id, score: 95, severity: Severity.CRITICAL }});
    await prisma.investigationFinding.create({ data: { caseId, findingType: 'MULTI_HOP_TRANSACTION', title: 'Multi-hop found', severity: Severity.CRITICAL }});

    // Insert Case 2 data
    await prisma.evidenceFile.create({ data: { id: 'rep-ev2', caseId: case2Id, originalFilename: 'test.csv', storedFilename: 'test.csv', artifactType: ArtifactType.BANK_TRANSACTION, mimeType: 'text/csv', fileExtension: '.csv', fileSize: 100, sha256: 'hash3', storagePath: 'path3', processingStatus: 'PROCESSED', integrityStatus: 'VERIFIED' }});
    const e2 = await prisma.entity.create({ data: { caseId: case2Id, type: EntityType.PHONE, canonicalValue: '123' } });

    const report = await reportContextBuilder.build(caseId, 'fake-report-id');
    
    expect(report.metadata.caseId).toBe(caseId);
    expect(report.evidenceSummary.length).toBe(1);
    expect(report.evidenceSummary[0].sha256).toBe('deadbeef123'); // SHA256 integrity check
    expect(report.entities.length).toBe(1);
    expect(report.entities[0].canonicalValue).toBe('ACC1');
    expect(report.executiveSummary.criticalRiskCount).toBe(1);
    expect(report.findings.length).toBe(1);
    
    // Cross-case isolation check
    expect(report.entities.some(e => e.canonicalValue === '123')).toBe(false);

    // Validate successfully
    expect(() => reportValidator.validate(report)).not.toThrow();
  });
});
