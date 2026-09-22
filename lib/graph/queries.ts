/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { buildGraph } from './builder';
import { GraphData } from './types';
import { EntityType, RelationshipType } from '@prisma/client';

export class GraphQueries {
  async getFullGraph(caseId: string): Promise<GraphData> {
    const entities = await prisma.entity.findMany({ where: { caseId } });
    const relationships = await prisma.relationship.findMany({
      where: { caseId },
      include: { evidence: true }
    });
    const risks = await prisma.riskAssessment.findMany({ where: { caseId } });

    return buildGraph(entities, relationships, risks);
  }

  async getTransactionPath(caseId: string): Promise<GraphData> {
    // A transaction path focuses on BANK_ACCOUNTs and UPIs and the relationships between them
    // as well as PHONEs or IMEIs linked to them.

    // 1. Get all financial relationships (TRANSFERRED_TO)
    const financialRels = await prisma.relationship.findMany({
      where: { 
        caseId,
        relationshipType: RelationshipType.TRANSFERRED_TO
      },
      include: { evidence: true }
    });

    const relatedEntityIds = new Set<string>();
    financialRels.forEach(r => {
      relatedEntityIds.add(r.sourceEntityId);
      relatedEntityIds.add(r.targetEntityId);
    });

    // 2. Fetch those entities
    const entities = await prisma.entity.findMany({
      where: {
        caseId,
        id: { in: Array.from(relatedEntityIds) }
      }
    });

    // 3. Fetch risks
    const risks = await prisma.riskAssessment.findMany({
      where: {
        caseId,
        entityId: { in: Array.from(relatedEntityIds) }
      }
    });

    return buildGraph(entities, financialRels, risks);
  }
}

export const graphQueries = new GraphQueries();
