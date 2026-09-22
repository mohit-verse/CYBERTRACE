/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from '@/lib/db';
import { correlationEngine } from '@/lib/correlation';
import { EntityType, RelationshipType } from '@prisma/client';

describe('Correlation Engine Integration', () => {
  let caseId: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `CASE-CORR-${Date.now()}`, title: 'Correlation Test' } });
      caseId = c.id;
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.relationshipEvidence.deleteMany({ where: { relationship: { caseId } } });
      await prisma.relationship.deleteMany({ where: { caseId } });
      await prisma.transaction.deleteMany({ where: { caseId } });
      await prisma.investigationFinding.deleteMany({ where: { caseId } });
      await prisma.entity.deleteMany({ where: { caseId } });
      await prisma.evidenceRecord.deleteMany({ where: { evidenceFile: { caseId } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId } });
      await prisma.case.delete({ where: { id: caseId } });
    }
  });

  it('generates correct relationships deterministically', async () => {
    if (!dbAvailable) return;

    const file = await prisma.evidenceFile.create({
      data: { caseId, originalFilename: 'cdr.csv', storedFilename: 'cdr', artifactType: 'CDR' }
    });

    const file2 = await prisma.evidenceFile.create({
      data: { caseId, originalFilename: 'bank.csv', storedFilename: 'bank', artifactType: 'BANK_TRANSACTION' }
    });

    // Create entities first
    const p1 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500001' } });
    const p2 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500002' } });
    const imei1 = await prisma.entity.create({ data: { caseId, type: EntityType.IMEI, canonicalValue: 'IMEI123' } });
    const a1 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC1' } });
    const a2 = await prisma.entity.create({ data: { caseId, type: EntityType.BANK_ACCOUNT, canonicalValue: 'ACC2' } });
    const txn = await prisma.entity.create({ data: { caseId, type: EntityType.TRANSACTION, canonicalValue: 'TXN123' } });

    // Create evidence records
    const r1 = await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: {
          canonical: {
            sourcePhone: '9876500001',
            targetPhone: '9876500002',
            sourceImei: 'IMEI123'
          }
        }
      }
    });

    const r2 = await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: {
          canonical: {
            sourcePhone: '9876500002', // p2 also uses IMEI123
            sourceImei: 'IMEI123'
          }
        }
      }
    });

    const r3 = await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file2.id,
        recordType: 'BANK_TRANSACTION',
        normalizedData: {
          canonical: {
            sourceAccount: 'ACC1',
            destinationAccount: 'ACC2',
            transactionReference: 'TXN123'
          }
        }
      }
    });

    const stats = await correlationEngine.runCorrelation(caseId);

    // Assertions
    const rels = await prisma.relationship.findMany({ where: { caseId } });

    // P1 -> USES -> IMEI123
    expect(rels.find(r => r.sourceEntityId === p1.id && r.targetEntityId === imei1.id && r.relationshipType === RelationshipType.USES)).toBeDefined();
    
    // P2 -> USES -> IMEI123
    expect(rels.find(r => r.sourceEntityId === p2.id && r.targetEntityId === imei1.id && r.relationshipType === RelationshipType.USES)).toBeDefined();
    
    // P1 -> CALLED -> P2
    expect(rels.find(r => r.sourceEntityId === p1.id && r.targetEntityId === p2.id && r.relationshipType === RelationshipType.CALLED)).toBeDefined();

    // ACC1 -> TRANSFERRED_TO -> ACC2
    expect(rels.find(r => r.sourceEntityId === a1.id && r.targetEntityId === a2.id && r.relationshipType === RelationshipType.TRANSFERRED_TO)).toBeDefined();
    
    // TXN123 -> FROM -> ACC1
    expect(rels.find(r => r.sourceEntityId === txn.id && r.targetEntityId === a1.id && r.relationshipType === RelationshipType.FROM)).toBeDefined();

    // False link prevention
    // There shouldn't be P1 -> LINKED_TO -> P2 just because they share IMEI
    expect(rels.find(r => r.sourceEntityId === p1.id && r.targetEntityId === p2.id && r.relationshipType === RelationshipType.LINKED_TO)).toBeUndefined();

    // Check findings (Shared IMEI)
    const findings = await prisma.investigationFinding.findMany({ where: { caseId } });
    expect(findings.find(f => f.findingType === 'SHARED_IMEI')).toBeDefined();

    // Check Transaction populated
    const txns = await prisma.transaction.findMany({ where: { caseId } });
    expect(txns.length).toBe(1);
    expect(txns[0].sourceAccountEntityId).toBe(a1.id);
    expect(txns[0].destinationAccountEntityId).toBe(a2.id);

    // Idempotency check
    const stats2 = await correlationEngine.runCorrelation(caseId);
    expect(stats2.acceptedRelationships).toBe(0); // Should be 0 new relationships
    expect(stats2.findingsGenerated).toBe(0); // 0 new findings
  });

  it('preserves contradictory evidence', async () => {
    if (!dbAvailable) return;

    const file = await prisma.evidenceFile.create({
      data: { caseId, originalFilename: 'cdr2.csv', storedFilename: 'cdr2', artifactType: 'CDR' }
    });

    const p3 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '9876500003' } });
    const imei2 = await prisma.entity.create({ data: { caseId, type: EntityType.IMEI, canonicalValue: 'IMEI2' } });
    const imei3 = await prisma.entity.create({ data: { caseId, type: EntityType.IMEI, canonicalValue: 'IMEI3' } });

    await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '9876500003', sourceImei: 'IMEI2' } }
      }
    });

    await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '9876500003', sourceImei: 'IMEI3' } } // Conflict!
      }
    });

    await correlationEngine.runCorrelation(caseId);

    const rels = await prisma.relationship.findMany({ where: { caseId, sourceEntityId: p3.id, relationshipType: RelationshipType.USES } });
    expect(rels.length).toBe(2); // Both edges preserved
    expect(rels.find(r => r.targetEntityId === imei2.id)).toBeDefined();
    expect(rels.find(r => r.targetEntityId === imei3.id)).toBeDefined();
  });
});
