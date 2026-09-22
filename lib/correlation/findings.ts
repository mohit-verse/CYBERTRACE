import prisma from '@/lib/db';
import { Severity, RelationshipType, EntityType } from '@prisma/client';
import { FindingCandidate } from './types';

export class FindingsGenerator {
  async generateFindings(caseId: string): Promise<FindingCandidate[]> {
    const findings: FindingCandidate[] = [];

    // Shared device identifier detected (IMEI)
    // Find IMEIs that have multiple phones USES them
    const sharedImeis = await prisma.relationship.groupBy({
      by: ['targetEntityId'],
      where: {
        caseId,
        relationshipType: RelationshipType.USES,
        sourceEntity: { type: EntityType.PHONE },
        targetEntity: { type: EntityType.IMEI }
      },
      _count: { sourceEntityId: true },
      having: {
        sourceEntityId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    for (const shared of sharedImeis) {
      const rels = await prisma.relationship.findMany({
        where: { targetEntityId: shared.targetEntityId, relationshipType: RelationshipType.USES }
      });
      const imeiEntity = await prisma.entity.findUnique({ where: { id: shared.targetEntityId } });
      findings.push({
        findingType: 'SHARED_IMEI',
        severity: Severity.HIGH,
        title: 'Shared IMEI Detected',
        description: `Multiple phones use the same IMEI (${imeiEntity?.canonicalValue})`,
        caseId,
        entities: [shared.targetEntityId, ...rels.map(r => r.sourceEntityId)]
      });
    }

    // Multi-hop transaction flow detected
    // A -> B -> C
    const transfers = await prisma.relationship.findMany({
      where: { caseId, relationshipType: RelationshipType.TRANSFERRED_TO }
    });
    
    const targets = new Set(transfers.map(t => t.targetEntityId));
    for (const t of transfers) {
      if (targets.has(t.sourceEntityId)) {
        findings.push({
          findingType: 'MULTI_HOP_TRANSACTION',
          severity: Severity.HIGH,
          title: 'Multi-Hop Transaction Flow Detected',
          description: 'A transaction flow spans multiple intermediaries.',
          caseId,
          entities: [t.sourceEntityId, t.targetEntityId]
        });
      }
    }

    // Deduplicate findings by title and entities (simplified)
    const uniqueFindings = new Map<string, FindingCandidate>();
    for (const f of findings) {
      const key = `${f.findingType}-${f.entities.sort().join(',')}`;
      if (!uniqueFindings.has(key)) {
        uniqueFindings.set(key, f);
      }
    }

    return Array.from(uniqueFindings.values());
  }
}

export const findingsGenerator = new FindingsGenerator();
