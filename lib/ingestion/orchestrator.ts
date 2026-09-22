import prisma from '@/lib/db';
import { retrieveEvidence } from '@/lib/evidence/storage';
import { parserRegistry } from '@/processing/parsers';
import { ParserInput, ParseResult } from '@/processing/parsers/types';

export class IngestionOrchestrator {
  /**
   * Processes an evidence file by orchestrating parser selection, parsing, and persisting records.
   */
  async processEvidence(caseId: string, evidenceId: string): Promise<ParseResult> {
    const evidence = await prisma.evidenceFile.findUnique({
      where: { id: evidenceId, caseId }
    });

    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found in case ${caseId}`);
    }

    if (!evidence.storagePath) {
      throw new Error(`Evidence ${evidenceId} is missing a physical storage path`);
    }

    // Set status to processing
    await prisma.evidenceFile.update({
      where: { id: evidenceId },
      data: { processingStatus: 'PROCESSING' }
    });

    let result: ParseResult;

    try {
      // 1. Retrieve file buffer
      const buffer = await retrieveEvidence(evidence.storagePath);

      // 2. Classify and Select Parser
      const input: ParserInput = {
        evidenceId: evidence.id,
        artifactType: evidence.artifactType,
        originalFilename: evidence.originalFilename,
        fileFormat: evidence.fileExtension || '',
        buffer
      };

      const parser = parserRegistry.getParser(input);
      if (!parser) {
        throw new Error(`No parser available for artifact type ${evidence.artifactType} and format ${evidence.fileExtension}`);
      }

      // 3. Execute deterministic parsing
      result = await parser.parse(input);

      // 4. Record Persistence / Idempotency handling
      // Clean up previous records if this is a reprocessing run
      await prisma.evidenceRecord.deleteMany({
        where: { evidenceFileId: evidenceId }
      });

      // Insert new records in batches for performance
      if (result.records.length > 0) {
        await prisma.evidenceRecord.createMany({
          data: result.records.map(record => ({
            evidenceFileId: evidenceId,
            sourceRecordId: record.sourceRecordId,
            recordType: record.recordType,
            recordTimestamp: record.recordTimestamp,
            normalizedData: record.normalizedData,
            rawReference: record.rawReference,
          }))
        });
      }

      // 5. Update processing status to PROCESSED
      await prisma.evidenceFile.update({
        where: { id: evidenceId },
        data: {
          processingStatus: 'PROCESSED',
          processedAt: new Date(),
          errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null
        }
      });

    } catch (error) {
      // Handle overall failure
      const err = error as Error;
      await prisma.evidenceFile.update({
        where: { id: evidenceId },
        data: {
          processingStatus: 'FAILED',
          errorMessage: err.message || 'Unknown processing error'
        }
      });
      throw error;
    }

    return result;
  }
}

export const ingestionOrchestrator = new IngestionOrchestrator();
