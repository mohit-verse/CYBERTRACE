/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { normalizationOrchestrator } from '@/lib/normalization/orchestrator';
import prisma from '@/lib/db';

describe('Normalization Orchestrator Integration', () => {
  let caseId: string;
  let evidenceFileId: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const testCase = await prisma.case.create({
        data: {
          caseNumber: `TEST-NORM-${Date.now()}`,
          title: 'Test Normalization',
        }
      });
      caseId = testCase.id;
      dbAvailable = true;

      evidenceFileId = `EV-NORM-${Date.now()}`;
      await prisma.evidenceFile.create({
        data: {
          id: evidenceFileId,
          caseId,
          originalFilename: 'test.csv',
          storedFilename: 'test.csv',
          artifactType: 'CDR',
          fileExtension: '.csv',
        }
      });

      // Insert unnormalized records
      await prisma.evidenceRecord.create({
        data: {
          evidenceFileId,
          recordType: 'CDR',
          normalizedData: {
            sourcePhone: '+91 98765-43210',
            targetPhone: '9876500003',
            timestamp: '2026-09-22T10:00:00Z'
          }
        }
      });

      // Contradiction / Invalid data test
      await prisma.evidenceRecord.create({
        data: {
          evidenceFileId,
          recordType: 'CDR',
          normalizedData: {
            sourcePhone: 'invalid_phone',
          }
        }
      });
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.evidenceRecord.deleteMany({ where: { evidenceFileId } });
      await prisma.evidenceFile.deleteMany({ where: { caseId } });
      await prisma.case.delete({ where: { id: caseId } });
    }
  });

  it('normalizes records correctly and is idempotent', async () => {
    if (!dbAvailable) return;

    // Run first time
    await normalizationOrchestrator.normalizeCaseEvidence(caseId);

    const records = await prisma.evidenceRecord.findMany({ where: { evidenceFileId } });
    expect(records.length).toBe(2);

    const validRecord = records.find(r => (r.normalizedData as any)?.sourcePhone === '+91 98765-43210');
    expect(validRecord).toBeDefined();
    
    const validData = validRecord?.normalizedData as any;
    expect(validData.canonical).toBeDefined();
    expect(validData.canonical.sourcePhone).toBe('9876543210');
    expect(validData.canonical.targetPhone).toBe('9876500003');

    const invalidRecord = records.find(r => (r.normalizedData as any)?.sourcePhone === 'invalid_phone');
    const invalidData = invalidRecord?.normalizedData as any;
    expect(invalidData.canonical).toBeUndefined();
    expect(invalidData.normalizationErrors).toContain('sourcePhone: Invalid phone format');

    // Test Idempotency
    await normalizationOrchestrator.normalizeCaseEvidence(caseId);
    const recordsAfter = await prisma.evidenceRecord.findMany({ where: { evidenceFileId } });
    const validAfter = recordsAfter.find(r => (r.normalizedData as any)?.sourcePhone === '+91 98765-43210')?.normalizedData as any;
    expect(validAfter.canonical.sourcePhone).toBe('9876543210');
  });
});
