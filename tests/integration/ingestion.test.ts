/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ingestionOrchestrator } from '@/lib/ingestion/orchestrator';
import prisma from '@/lib/db';
import { generateStoragePath, getStorageRoot, storeEvidence } from '@/lib/evidence/storage';
import path from 'path';

describe('Ingestion Orchestrator Integration', () => {
  let caseId: string;
  let evidenceId: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const testCase = await prisma.case.create({
        data: {
          caseNumber: `TEST-CASE-INGEST-${Date.now()}`,
          title: 'Test Case Ingestion',
        }
      });
      caseId = testCase.id;
      dbAvailable = true;

      // Mock Evidence File
      const csvContent = `Calling Number,Called Number,Timestamp,Duration\n123,456,2026-09-22T10:00:00Z,60`;
      evidenceId = `EVID-${Date.now()}`;
      
      const storagePath = generateStoragePath({ caseId, evidenceId, fileExtension: '.csv' });
      await storeEvidence(Buffer.from(csvContent), storagePath);

      await prisma.evidenceFile.create({
        data: {
          id: evidenceId,
          caseId,
          originalFilename: 'test_cdr.csv',
          storedFilename: path.basename(storagePath),
          artifactType: 'CDR',
          fileExtension: '.csv',
          storagePath,
          processingStatus: 'UPLOADED',
          integrityStatus: 'VERIFIED'
        }
      });

    } catch (e) {
      console.warn('Database unavailable. Skipping ingestion DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.evidenceRecord.deleteMany({ where: { evidenceFileId: evidenceId } });
      await prisma.evidenceFile.deleteMany({ where: { caseId } });
      await prisma.case.delete({ where: { id: caseId } });
    }
  });

  it('orchestrates ingestion correctly', async () => {
    if (!dbAvailable) return;

    const result = await ingestionOrchestrator.processEvidence(caseId, evidenceId);
    
    expect(result.statistics.total).toBe(1);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].recordType).toBe('CDR');

    // Check DB persistence
    const records = await prisma.evidenceRecord.findMany({ where: { evidenceFileId: evidenceId } });
    expect(records.length).toBe(1);
    expect(records[0].recordType).toBe('CDR');
    
    // Check Processing Status
    const ev = await prisma.evidenceFile.findUnique({ where: { id: evidenceId } });
    expect(ev?.processingStatus).toBe('PROCESSED');

    // Test Idempotency (re-running should replace records)
    const result2 = await ingestionOrchestrator.processEvidence(caseId, evidenceId);
    expect(result2.statistics.success).toBe(1);
    const recordsAfter = await prisma.evidenceRecord.findMany({ where: { evidenceFileId: evidenceId } });
    expect(recordsAfter.length).toBe(1); // Still 1, did not duplicate blindly
  });
});
