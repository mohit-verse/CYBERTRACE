/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { EntityType, RelationshipType, Entity } from '@prisma/client';
import { EvaluatedRiskFactor, RISK_WEIGHTS } from './types';

export class RiskEvaluators {
  async evaluateMultiHop(caseId: string, entityId: string): Promise<EvaluatedRiskFactor | null> {
    // Check if this entity receives funds and sends funds (intermediate node in multi-hop)
    const incoming = await prisma.relationship.findMany({
      where: { targetEntityId: entityId, relationshipType: RelationshipType.TRANSFERRED_TO },
      include: { evidence: true }
    });
    
    const outgoing = await prisma.relationship.findMany({
      where: { sourceEntityId: entityId, relationshipType: RelationshipType.TRANSFERRED_TO },
      include: { evidence: true }
    });

    if (incoming.length > 0 && outgoing.length > 0) {
      const evidenceRefs = [...incoming.flatMap(i => i.evidence.map(e => e.evidenceRecordId)), ...outgoing.flatMap(o => o.evidence.map(e => e.evidenceRecordId))];
      return {
        factorType: 'MULTI_HOP_TRANSACTION',
        weight: RISK_WEIGHTS.MULTI_HOP_TRANSACTION,
        description: 'Entity acts as an intermediary in a multi-hop transaction flow.',
        evidenceReferences: Array.from(new Set(evidenceRefs))
      };
    }
    return null;
  }

  async evaluateSharedImei(caseId: string, entityId: string, entity: Entity): Promise<EvaluatedRiskFactor | null> {
    if (entity.type !== EntityType.PHONE) return null;

    // Get IMEIs this phone uses
    const usesImei = await prisma.relationship.findMany({
      where: { sourceEntityId: entityId, relationshipType: RelationshipType.USES, targetEntity: { type: EntityType.IMEI } },
      include: { evidence: true }
    });

    for (const rel of usesImei) {
      // Are there other phones using this IMEI?
      const otherPhones = await prisma.relationship.findMany({
        where: { targetEntityId: rel.targetEntityId, relationshipType: RelationshipType.USES, sourceEntity: { type: EntityType.PHONE }, sourceEntityId: { not: entityId } },
        include: { evidence: true }
      });

      if (otherPhones.length > 0) {
        const evidenceRefs = [
          ...rel.evidence.map(e => e.evidenceRecordId),
          ...otherPhones.flatMap(o => o.evidence.map(e => e.evidenceRecordId))
        ];
        return {
          factorType: 'SHARED_IMEI',
          weight: RISK_WEIGHTS.SHARED_IMEI,
          description: 'Phone is associated with an IMEI used by other phones.',
          evidenceReferences: Array.from(new Set(evidenceRefs))
        };
      }
    }
    return null;
  }

  async evaluateSharedIp(caseId: string, entityId: string, entity: Entity): Promise<EvaluatedRiskFactor | null> {
    if (entity.type !== EntityType.DEVICE) return null;

    const connectedToIp = await prisma.relationship.findMany({
      where: { sourceEntityId: entityId, relationshipType: RelationshipType.CONNECTED_FROM, targetEntity: { type: EntityType.IP } },
      include: { evidence: true }
    });

    for (const rel of connectedToIp) {
      const otherDevices = await prisma.relationship.findMany({
        where: { targetEntityId: rel.targetEntityId, relationshipType: RelationshipType.CONNECTED_FROM, sourceEntity: { type: EntityType.DEVICE }, sourceEntityId: { not: entityId } },
        include: { evidence: true }
      });

      if (otherDevices.length > 0) {
        const evidenceRefs = [...rel.evidence.map(e => e.evidenceRecordId), ...otherDevices.flatMap(o => o.evidence.map(e => e.evidenceRecordId))];
        return {
          factorType: 'SHARED_IP',
          weight: RISK_WEIGHTS.SHARED_IP,
          description: 'Device is associated with an IP address used by other devices.',
          evidenceReferences: Array.from(new Set(evidenceRefs))
        };
      }
    }
    return null;
  }

  async evaluateSharedMac(caseId: string, entityId: string, entity: Entity): Promise<EvaluatedRiskFactor | null> {
    if (entity.type !== EntityType.DEVICE) return null;

    const hasMac = await prisma.relationship.findMany({
      where: { sourceEntityId: entityId, relationshipType: RelationshipType.HAS, targetEntity: { type: EntityType.MAC } },
      include: { evidence: true }
    });

    for (const rel of hasMac) {
      const otherDevices = await prisma.relationship.findMany({
        where: { targetEntityId: rel.targetEntityId, relationshipType: RelationshipType.HAS, sourceEntity: { type: EntityType.DEVICE }, sourceEntityId: { not: entityId } },
        include: { evidence: true }
      });

      if (otherDevices.length > 0) {
        const evidenceRefs = [...rel.evidence.map(e => e.evidenceRecordId), ...otherDevices.flatMap(o => o.evidence.map(e => e.evidenceRecordId))];
        return {
          factorType: 'SHARED_MAC',
          weight: RISK_WEIGHTS.SHARED_MAC,
          description: 'Device is associated with a MAC address used by other devices.',
          evidenceReferences: Array.from(new Set(evidenceRefs))
        };
      }
    }
    return null;
  }

  async evaluateRecurringUpi(caseId: string, entityId: string, entity: Entity): Promise<EvaluatedRiskFactor | null> {
    if (entity.type !== EntityType.UPI) return null;

    // Check transactions sent TO this UPI (where it's the destination)
    // Actually our correlation engine linked UPI to BANK_ACCOUNT.
    // The instructions say "Multiple transactions repeatedly route funds toward the same validated UPI identifier."
    // Let's check Transactions where channel is 'UPI' and destination is linked to this UPI.
    const linkedBankAccounts = await prisma.relationship.findMany({
      where: { sourceEntityId: entityId, relationshipType: RelationshipType.LINKED_TO, targetEntity: { type: EntityType.BANK_ACCOUNT } }
    });

    const accountIds = linkedBankAccounts.map(r => r.targetEntityId);
    if (accountIds.length === 0) return null;

    const incomingTxns = await prisma.transaction.findMany({
      where: { caseId, channel: 'UPI', destinationAccountEntityId: { in: accountIds } }
    });

    if (incomingTxns.length > 1) { // multiple transactions
      return {
        factorType: 'RECURRING_UPI_BENEFICIARY',
        weight: RISK_WEIGHTS.RECURRING_UPI_BENEFICIARY,
        description: 'UPI identifier repeatedly received funds across multiple transactions.',
        evidenceReferences: Array.from(new Set(incomingTxns.map(tx => tx.sourceEvidenceRecordId).filter(Boolean) as string[]))
      };
    }
    return null;
  }
}

export const riskEvaluators = new RiskEvaluators();
