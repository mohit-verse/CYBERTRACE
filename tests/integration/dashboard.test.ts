/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { Severity, EntityType, RelationshipType, ArtifactType } from '@prisma/client';
import { NextRequest } from 'next/server';

describe('Dashboard API Integration', () => {
  let caseId: string;
  let case2Id: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `DASH-${Date.now()}`, title: 'Dash Test' } });
      caseId = c.id;
      
      const c2 = await prisma.case.create({ data: { caseNumber: `DASH-2-${Date.now()}`, title: 'Dash Test 2' } });
      case2Id = c2.id;
      
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId: { in: [caseId, case2Id] } } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.investigationFinding.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.relationship.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.entity.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.case.deleteMany({ where: { id: { in: [caseId, case2Id] } } });
    }
  });

  it('aggregates dashboard KPIs accurately with case isolation', async () => {
    if (!dbAvailable) return;

    // Insert Case 1 data
    await prisma.evidenceFile.create({ data: { id: 'ev1', caseId, originalFilename: 'test.csv', storedFilename: 'test.csv', artifactType: ArtifactType.BANK_TRANSACTION, mimeType: 'text/csv', fileExtension: '.csv', fileSize: 100, sha256: 'hash1', storagePath: 'path1', processingStatus: 'PROCESSED', integrityStatus: 'VERIFIED' }});
    await prisma.evidenceFile.create({ data: { id: 'ev2', caseId, originalFilename: 'test.csv', storedFilename: 'test.csv', artifactType: ArtifactType.BANK_TRANSACTION, mimeType: 'text/csv', fileExtension: '.csv', fileSize: 100, sha256: 'hash2', storagePath: 'path2', processingStatus: 'FAILED', integrityStatus: 'MISMATCH' }});

    const e1 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC1' } });
    const e2 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC2' } });
    
    await prisma.relationship.create({ data: { caseId, sourceEntityId: e1.id, targetEntityId: e2.id, relationshipType: RelationshipType.TRANSFERRED_TO, confidence: 'HIGH' }});
    await prisma.investigationFinding.create({ data: { caseId, findingType: 'MULTI_HOP_TRANSACTION', severity: 'HIGH', title: 'Multi-hop found' }});
    await prisma.riskAssessment.create({ data: { caseId, entityId: e1.id, score: 90, severity: Severity.CRITICAL }});
    await prisma.riskAssessment.create({ data: { caseId, entityId: e2.id, score: 60, severity: Severity.HIGH }});

    // Insert Case 2 data (isolation check)
    await prisma.evidenceFile.create({ data: { id: 'ev3', caseId: case2Id, originalFilename: 'test.csv', storedFilename: 'test.csv', artifactType: ArtifactType.BANK_TRANSACTION, mimeType: 'text/csv', fileExtension: '.csv', fileSize: 100, sha256: 'hash3', storagePath: 'path3', processingStatus: 'PROCESSED', integrityStatus: 'VERIFIED' }});
    const e3 = await prisma.entity.create({ data: { caseId: case2Id, type: EntityType.PHONE, canonicalValue: '123' } });
    await prisma.riskAssessment.create({ data: { caseId: case2Id, entityId: e3.id, score: 100, severity: Severity.CRITICAL }});

    // We fetch the route using mock request
    const { GET } = await import('@/app/api/cases/[caseId]/dashboard/route');
    const res = await GET({} as NextRequest, { params: { caseId } });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.evidence.total).toBe(2);
    expect(json.data.evidence.processed).toBe(1);
    expect(json.data.evidence.failed).toBe(1);
    expect(json.data.investigation.entityCount).toBe(2);
    expect(json.data.investigation.relationshipCount).toBe(1);
    expect(json.data.investigation.findingCount).toBe(1);
    expect(json.data.risk.criticalRiskCount).toBe(1);
    expect(json.data.risk.highRiskCount).toBe(1);
  });
});
