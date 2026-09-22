import prisma from '@/lib/db';
import { EntityExtractor } from './extractor';
import { entityProvenance } from './provenance';

export class EntityResolver {
  private extractor = new EntityExtractor();

  async resolveCaseEntities(caseId: string): Promise<void> {
    const records = await prisma.evidenceRecord.findMany({
      where: { evidenceFile: { caseId } }
    });

    for (const record of records) {
      const candidates = this.extractor.extract(record);

      for (const candidate of candidates) {
        // Find existing entity using exact canonical match
        let entity = await prisma.entity.findUnique({
          where: {
            caseId_type_canonicalValue: {
              caseId,
              type: candidate.type,
              canonicalValue: candidate.canonicalValue
            }
          }
        });

        if (!entity) {
          // Create new entity
          try {
            entity = await prisma.entity.create({
              data: {
                caseId,
                type: candidate.type,
                canonicalValue: candidate.canonicalValue,
                displayValue: candidate.displayValue || candidate.canonicalValue,
                metadata: {
                  evidenceReferences: [{ evidenceRecordId: record.id }]
                }
              }
            });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            // Race condition fallback: someone else created it
            entity = await prisma.entity.findUnique({
              where: {
                caseId_type_canonicalValue: {
                  caseId,
                  type: candidate.type,
                  canonicalValue: candidate.canonicalValue
                }
              }
            });
            
            if (entity) {
              await entityProvenance.linkEvidence(entity.id, record.id);
            }
          }
        } else {
          // Link existing entity
          await entityProvenance.linkEvidence(entity.id, record.id);
        }
      }
    }
  }
}

export const entityResolver = new EntityResolver();
