/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from '@/lib/db';
import { riskEngine } from '@/lib/risk';
import { EntityType, RelationshipType, Severity } from '@prisma/client';

describe('Risk Engine Integration', () => {
  let caseId: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `CASE-RISK-${Date.now()}`, title: 'Risk Test' } });
      caseId = c.id;
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId } });
      await prisma.relationshipEvidence.deleteMany({ where: { relationship: { caseId } } });
      await prisma.relationship.deleteMany({ where: { caseId } });
      await prisma.transaction.deleteMany({ where: { caseId } });
      await prisma.entity.deleteMany({ where: { caseId } });
      await prisma.case.delete({ where: { id: caseId } });
    }
  });

  it('calculates risk correctly and enforces cap', async () => {
    if (!dbAvailable) return;

    // Create Entities
    const p1 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500001' } });
    const p2 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500002' } });
    const p3 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500003' } });
    const imei = await prisma.entity.create({ data: { caseId, type: EntityType.IMEI, canonicalValue: 'IMEI123' } });

    // Set up Shared IMEI
    await prisma.relationship.create({
      data: {
        caseId, sourceEntityId: p1.id, targetEntityId: imei.id, relationshipType: RelationshipType.USES, confidence: 'HIGH',
        evidence: { create: { evidenceRecordId: 'test-ev-1' } } // Faking evidence record id because schema doesn't strictly check fk
      }
    });
    await prisma.relationship.create({
      data: {
        caseId, sourceEntityId: p2.id, targetEntityId: imei.id, relationshipType: RelationshipType.USES, confidence: 'HIGH',
        evidence: { create: { evidenceRecordId: 'test-ev-2' } }
      }
    });

    const stats = await riskEngine.runRiskCalculation(caseId);

    // P1 and P2 should have SHARED_IMEI
    const p1Risk = await prisma.riskAssessment.findFirst({ where: { entityId: p1.id }, include: { factors: true } });
    expect(p1Risk).toBeDefined();
    expect(p1Risk?.score).toBe(8); // SHARED_IMEI = 8
    expect(p1Risk?.severity).toBe(Severity.LOW);
    expect(p1Risk?.factors[0].factorType).toBe('SHARED_IMEI');
    expect((p1Risk?.factors[0].evidenceReferences as any).length).toBe(2);

    const p3Risk = await prisma.riskAssessment.findFirst({ where: { entityId: p3.id }, include: { factors: true } });
    expect(p3Risk?.score).toBe(0);
    expect(p3Risk?.factors.length).toBe(0);

    // Test Idempotency (recalculation)
    await riskEngine.runRiskCalculation(caseId);
    const p1RiskAfter = await prisma.riskAssessment.findMany({ where: { entityId: p1.id } });
    expect(p1RiskAfter.length).toBe(1); // Should replace, not duplicate
    expect(p1RiskAfter[0].score).toBe(8);
  });

  it('calculates Multi-Hop and tests severity thresholds', async () => {
    if (!dbAvailable) return;

    const acc1 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC1' } });
    const acc2 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC2' } });
    const acc3 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC3' } });

    // Multi hop A -> B -> C (B is intermediary)
    await prisma.relationship.create({
      data: {
        caseId, sourceEntityId: acc1.id, targetEntityId: acc2.id, relationshipType: RelationshipType.TRANSFERRED_TO, confidence: 'HIGH',
        evidence: { create: { evidenceRecordId: 'test-ev-tx1' } }
      }
    });
    await prisma.relationship.create({
      data: {
        caseId, sourceEntityId: acc2.id, targetEntityId: acc3.id, relationshipType: RelationshipType.TRANSFERRED_TO, confidence: 'HIGH',
        evidence: { create: { evidenceRecordId: 'test-ev-tx2' } }
      }
    });

    await riskEngine.runRiskCalculation(caseId);

    const acc2Risk = await prisma.riskAssessment.findFirst({ where: { entityId: acc2.id }, include: { factors: true } });
    expect(acc2Risk?.score).toBe(25); // MULTI_HOP_TRANSACTION = 25
    expect(acc2Risk?.severity).toBe(Severity.MEDIUM); // 25 is MEDIUM
    expect(acc2Risk?.factors[0].factorType).toBe('MULTI_HOP_TRANSACTION');
  });

  it('calculates Recurring UPI', async () => {
    if (!dbAvailable) return;

    const upi1 = await prisma.entity.create({ data: { caseId, type: EntityType.UPI, canonicalValue: 'user@upi' } });
    const bankForUpi = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'BANK-FOR-UPI' } });

    // Link UPI to Bank Account
    await prisma.relationship.create({
      data: { caseId, sourceEntityId: upi1.id, targetEntityId: bankForUpi.id, relationshipType: RelationshipType.LINKED_TO, confidence: 'HIGH' }
    });

    // Create 2 transactions to the linked bank account via UPI channel
    await prisma.transaction.create({
      data: { caseId, channel: 'UPI', destinationAccountEntityId: bankForUpi.id, sourceEvidenceRecordId: 'ev-upi-1' }
    });
    await prisma.transaction.create({
      data: { caseId, channel: 'UPI', destinationAccountEntityId: bankForUpi.id, sourceEvidenceRecordId: 'ev-upi-2' }
    });

    await riskEngine.runRiskCalculation(caseId);

    const upiRisk = await prisma.riskAssessment.findFirst({ where: { entityId: upi1.id }, include: { factors: true } });
    expect(upiRisk?.score).toBe(7);
    expect(upiRisk?.factors[0].factorType).toBe('RECURRING_UPI_BENEFICIARY');
  });
});
