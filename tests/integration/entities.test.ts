/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { entityResolver } from '@/lib/entities/resolver';
import { EntityType } from '@prisma/client';

describe('Entity Resolution Integration', () => {
  let case1: string;
  let case2: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c1 = await prisma.case.create({ data: { caseNumber: `CASE-ENT1-${Date.now()}`, title: 'Test 1' } });
      const c2 = await prisma.case.create({ data: { caseNumber: `CASE-ENT2-${Date.now()}`, title: 'Test 2' } });
      case1 = c1.id;
      case2 = c2.id;
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.entity.deleteMany({ where: { caseId: { in: [case1, case2] } } });
      await prisma.evidenceRecord.deleteMany({ where: { evidenceFile: { caseId: { in: [case1, case2] } } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId: { in: [case1, case2] } } });
      await prisma.case.deleteMany({ where: { id: { in: [case1, case2] } } });
    }
  });

  it('resolves exact match within same case', async () => {
    if (!dbAvailable) return;

    const file = await prisma.evidenceFile.create({
      data: { caseId: case1, originalFilename: 'test.csv', storedFilename: 'test', artifactType: 'CDR' }
    });

    const rec1 = await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '9876543210' }, sourcePhone: '+91 98765-43210' }
      }
    });

    const rec2 = await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '9876543210' }, sourcePhone: '9876543210' }
      }
    });

    await entityResolver.resolveCaseEntities(case1);

    const entities = await prisma.entity.findMany({ where: { caseId: case1, type: EntityType.PHONE } });
    expect(entities.length).toBe(1);
    expect(entities[0].canonicalValue).toBe('9876543210');

    // Provenance
    const metadata = entities[0].metadata as any;
    expect(metadata.evidenceReferences.length).toBe(2);
    expect(metadata.evidenceReferences.map((r: any) => r.evidenceRecordId)).toContain(rec1.id);
    expect(metadata.evidenceReferences.map((r: any) => r.evidenceRecordId)).toContain(rec2.id);

    // Idempotency
    await entityResolver.resolveCaseEntities(case1);
    const entitiesAfter = await prisma.entity.findMany({ where: { caseId: case1, type: EntityType.PHONE } });
    expect(entitiesAfter.length).toBe(1);
    expect((entitiesAfter[0].metadata as any).evidenceReferences.length).toBe(2);
  });

  it('isolates entities across cases', async () => {
    if (!dbAvailable) return;

    const file2 = await prisma.evidenceFile.create({
      data: { caseId: case2, originalFilename: 'test2.csv', storedFilename: 'test2', artifactType: 'CDR' }
    });

    await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file2.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '9876543210' } }
      }
    });

    await entityResolver.resolveCaseEntities(case2);

    const entitiesC1 = await prisma.entity.findMany({ where: { caseId: case1, type: EntityType.PHONE, canonicalValue: '9876543210' } });
    const entitiesC2 = await prisma.entity.findMany({ where: { caseId: case2, type: EntityType.PHONE, canonicalValue: '9876543210' } });

    expect(entitiesC1.length).toBe(1);
    expect(entitiesC2.length).toBe(1);
    expect(entitiesC1[0].id).not.toBe(entitiesC2[0].id); // Case isolation
  });

  it('maintains distinct entity types for same string value', async () => {
    if (!dbAvailable) return;

    const file = await prisma.evidenceFile.create({
      data: { caseId: case1, originalFilename: 'test-mac.json', storedFilename: 'test', artifactType: 'ANDROID_LOG' }
    });

    await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'ANDROID_LOG',
        normalizedData: { canonical: { imei: '123456', deviceId: '123456' } } // Exact same value, different types
      }
    });

    await entityResolver.resolveCaseEntities(case1);

    const imei = await prisma.entity.findFirst({ where: { caseId: case1, type: EntityType.IMEI, canonicalValue: '123456' } });
    const dev = await prisma.entity.findFirst({ where: { caseId: case1, type: EntityType.DEVICE, canonicalValue: '123456' } });

    expect(imei).toBeDefined();
    expect(dev).toBeDefined();
    expect(imei?.id).not.toBe(dev?.id);
  });

  it('ignores missing/invalid data', async () => {
    if (!dbAvailable) return;

    const file = await prisma.evidenceFile.create({
      data: { caseId: case1, originalFilename: 'test-inv.json', storedFilename: 'test', artifactType: 'CDR' }
    });

    await prisma.evidenceRecord.create({
      data: {
        evidenceFileId: file.id,
        recordType: 'CDR',
        normalizedData: { canonical: { sourcePhone: '' }, sourcePhone: 'invalid' } 
      }
    });

    await entityResolver.resolveCaseEntities(case1);

    const emptyPhone = await prisma.entity.findFirst({ where: { caseId: case1, type: EntityType.PHONE, canonicalValue: '' } });
    expect(emptyPhone).toBeNull();
  });

  it('no relationships or risk created', async () => {
    if (!dbAvailable) return;

    const rels = await prisma.relationship.count({ where: { caseId: case1 } });
    const risks = await prisma.riskAssessment.count({ where: { caseId: case1 } });

    expect(rels).toBe(0);
    expect(risks).toBe(0);
  });
});
