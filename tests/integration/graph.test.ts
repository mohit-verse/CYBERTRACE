/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { graphQueries } from '@/lib/graph';
import { EntityType, RelationshipType, Severity } from '@prisma/client';

describe('Graph API Integration', () => {
  let caseId: string;
  let case2Id: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `GRAPH-${Date.now()}`, title: 'Graph Test' } });
      caseId = c.id;
      
      const c2 = await prisma.case.create({ data: { caseNumber: `GRAPH-2-${Date.now()}`, title: 'Graph Test 2' } });
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
      await prisma.relationshipEvidence.deleteMany({ where: { relationship: { caseId: { in: [caseId, case2Id] } } } });
      await prisma.relationship.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.entity.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.case.deleteMany({ where: { id: { in: [caseId, case2Id] } } });
    }
  });

  it('builds empty graph when no entities exist', async () => {
    if (!dbAvailable) return;

    const data = await graphQueries.getFullGraph(caseId);
    expect(data.nodes.length).toBe(0);
    expect(data.edges.length).toBe(0);
  });

  it('builds graph with entities, edges, and risk, maintaining case isolation', async () => {
    if (!dbAvailable) return;

    // Case 1 Data
    const e1 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '123' } });
    const e2 = await prisma.entity.create({ data: { caseId, type: EntityType.IMEI, canonicalValue: 'IMEI1' } });
    const e3 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC1' } });
    const e4 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC2' } });

    await prisma.relationship.create({
      data: { caseId, sourceEntityId: e1.id, targetEntityId: e2.id, relationshipType: RelationshipType.USES, confidence: 'HIGH', reason: 'CDR' }
    });
    
    await prisma.relationship.create({
      data: { caseId, sourceEntityId: e3.id, targetEntityId: e4.id, relationshipType: RelationshipType.TRANSFERRED_TO, confidence: 'HIGH' }
    });

    await prisma.riskAssessment.create({
      data: { caseId, entityId: e3.id, score: 75, severity: Severity.CRITICAL, modelVersion: 'v1' }
    });

    // Case 2 Data (Should be isolated)
    const eOther = await prisma.entity.create({ data: { caseId: case2Id, type: EntityType.PHONE, canonicalValue: '999' } });
    await prisma.riskAssessment.create({ data: { caseId: case2Id, entityId: eOther.id, score: 90, severity: Severity.CRITICAL } });

    const fullGraph = await graphQueries.getFullGraph(caseId);
    expect(fullGraph.nodes.length).toBe(4);
    expect(fullGraph.edges.length).toBe(2);
    
    // Check Case Isolation
    const otherNodes = fullGraph.nodes.filter(n => n.data.id === eOther.id);
    expect(otherNodes.length).toBe(0);

    // Check edge properties
    const edgeUses = fullGraph.edges.find(e => e.data.type === 'USES');
    expect(edgeUses).toBeDefined();
    expect(edgeUses?.data.source).toBe(e1.id); // Direction preserved
    expect(edgeUses?.data.target).toBe(e2.id);
    expect(edgeUses?.data.confidence).toBe('HIGH');
    
    // Check Risk attachment
    const riskNode = fullGraph.nodes.find(n => n.data.id === e3.id);
    expect(riskNode?.data.riskScore).toBe(75);
    expect(riskNode?.data.riskSeverity).toBe('CRITICAL');

    // Test Transaction Path
    const txPath = await graphQueries.getTransactionPath(caseId);
    expect(txPath.nodes.length).toBe(2); // Only ACC1 and ACC2 (involved in TRANSFERRED_TO)
    expect(txPath.edges.length).toBe(1); // Only the TRANSFERRED_TO edge
    expect(txPath.edges[0].data.type).toBe('TRANSFERRED_TO');
  });
});
