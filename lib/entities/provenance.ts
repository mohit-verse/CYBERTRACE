import prisma from '@/lib/db';
import { Entity } from '@prisma/client';

export interface EvidenceReference {
  evidenceRecordId: string;
}

export class EntityProvenance {
  /**
   * Adds an evidence record reference to an entity's metadata if not already present.
   */
  async linkEvidence(entityId: string, evidenceRecordId: string): Promise<Entity> {
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) throw new Error(`Entity ${entityId} not found`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = (entity.metadata as any) || {};
    const refs: EvidenceReference[] = metadata.evidenceReferences || [];

    if (!refs.some(r => r.evidenceRecordId === evidenceRecordId)) {
      refs.push({ evidenceRecordId });
      metadata.evidenceReferences = refs;

      return prisma.entity.update({
        where: { id: entityId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { metadata: metadata as any }
      });
    }

    return entity;
  }
}

export const entityProvenance = new EntityProvenance();
