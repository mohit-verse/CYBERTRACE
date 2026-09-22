/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityType, RelationshipType, Confidence } from '@prisma/client';
import { CandidateRelationship, CorrelationRule } from './types';

function createCandidate(
  sourceType: EntityType, sourceVal: string | undefined,
  targetType: EntityType, targetVal: string | undefined,
  relType: RelationshipType, confidence: Confidence,
  reason: string, recordId: string, ruleId: string, timestamp?: Date
): CandidateRelationship | null {
  if (!sourceVal || !targetVal) return null;
  return {
    sourceEntityType: sourceType,
    sourceCanonicalValue: sourceVal,
    targetEntityType: targetType,
    targetCanonicalValue: targetVal,
    relationshipType: relType,
    confidence,
    reason,
    evidenceRecordId: recordId,
    ruleId,
    timestamp
  };
}

export const telecomDeviceRule: CorrelationRule = {
  id: 'R_TELECOM_DEVICE',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (record.recordType === 'CDR') {
      const ts = data.timestamp ? new Date(data.timestamp) : undefined;
      // Source Phone
      if (data.sourcePhone && data.sourceImei) {
        const c = createCandidate(EntityType.PHONE, data.sourcePhone, EntityType.IMEI, data.sourceImei, RelationshipType.USES, Confidence.HIGH, 'CDR explicitly identifies caller Phone and IMEI', record.id, 'R_TELECOM_DEVICE', ts);
        if (c) res.push(c);
      }
      if (data.sourcePhone && data.sourceImsi) {
        const c = createCandidate(EntityType.PHONE, data.sourcePhone, EntityType.IMSI, data.sourceImsi, RelationshipType.HAS, Confidence.HIGH, 'CDR explicitly identifies caller Phone and IMSI', record.id, 'R_TELECOM_DEVICE', ts);
        if (c) res.push(c);
      }
      // Target Phone
      if (data.targetPhone && data.targetImei) {
        const c = createCandidate(EntityType.PHONE, data.targetPhone, EntityType.IMEI, data.targetImei, RelationshipType.USES, Confidence.HIGH, 'CDR explicitly identifies callee Phone and IMEI', record.id, 'R_TELECOM_DEVICE', ts);
        if (c) res.push(c);
      }
      if (data.targetPhone && data.targetImsi) {
        const c = createCandidate(EntityType.PHONE, data.targetPhone, EntityType.IMSI, data.targetImsi, RelationshipType.HAS, Confidence.HIGH, 'CDR explicitly identifies callee Phone and IMSI', record.id, 'R_TELECOM_DEVICE', ts);
        if (c) res.push(c);
      }
    }
    return res;
  }
};

export const communicationRule: CorrelationRule = {
  id: 'R_COMMUNICATION',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (record.recordType === 'CDR') {
      const ts = data.timestamp ? new Date(data.timestamp) : undefined;
      const c = createCandidate(EntityType.PHONE, data.sourcePhone, EntityType.PHONE, data.targetPhone, RelationshipType.CALLED, Confidence.HIGH, 'CDR explicitly establishes communication', record.id, 'R_COMMUNICATION', ts);
      if (c) res.push(c);
    }
    return res;
  }
};

export const financialFlowRule: CorrelationRule = {
  id: 'R_FINANCIAL_FLOW',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (record.recordType === 'BANK_TRANSACTION') {
      const ts = data.timestamp ? new Date(data.timestamp) : undefined;
      
      const c = createCandidate(EntityType.BANK_ACCOUNT, data.sourceAccount, EntityType.BANK_ACCOUNT, data.destinationAccount, RelationshipType.TRANSFERRED_TO, Confidence.HIGH, 'Structured transaction explicitly identifies source and destination accounts', record.id, 'R_FINANCIAL_FLOW', ts);
      if (c) res.push(c);

      // TRANSACTION direction rules
      if (data.transactionReference && data.sourceAccount) {
        const fromC = createCandidate(EntityType.TRANSACTION, data.transactionReference, EntityType.BANK_ACCOUNT, data.sourceAccount, RelationshipType.FROM, Confidence.HIGH, 'Transaction explicitly originated from account', record.id, 'R_FINANCIAL_FLOW', ts);
        if (fromC) res.push(fromC);
      }
      if (data.transactionReference && data.destinationAccount) {
        const toC = createCandidate(EntityType.TRANSACTION, data.transactionReference, EntityType.BANK_ACCOUNT, data.destinationAccount, RelationshipType.TO, Confidence.HIGH, 'Transaction explicitly destined to account', record.id, 'R_FINANCIAL_FLOW', ts);
        if (toC) res.push(toC);
      }
    }
    return res;
  }
};

export const upiBankRule: CorrelationRule = {
  id: 'R_UPI_BANK',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (data.upiId && data.sourceAccount) {
      const c = createCandidate(EntityType.UPI, data.upiId, EntityType.BANK_ACCOUNT, data.sourceAccount, RelationshipType.LINKED_TO, Confidence.HIGH, 'Evidence explicitly links UPI to Bank Account', record.id, 'R_UPI_BANK');
      if (c) res.push(c);
    }
    return res;
  }
};

export const deviceNetworkRule: CorrelationRule = {
  id: 'R_DEVICE_NETWORK',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (record.recordType === 'ANDROID_LOG') {
      const ts = data.timestamp ? new Date(data.timestamp) : undefined;
      if (data.deviceId && data.ipAddress) {
        const c = createCandidate(EntityType.DEVICE, data.deviceId, EntityType.IP, data.ipAddress, RelationshipType.CONNECTED_FROM, Confidence.HIGH, 'Android log explicitly establishes IP association', record.id, 'R_DEVICE_NETWORK', ts);
        if (c) res.push(c);
      }
      if (data.deviceId && data.macAddress) {
        const c = createCandidate(EntityType.DEVICE, data.deviceId, EntityType.MAC, data.macAddress, RelationshipType.HAS, Confidence.HIGH, 'Android log explicitly establishes MAC association', record.id, 'R_DEVICE_NETWORK', ts);
        if (c) res.push(c);
      }
    }
    return res;
  }
};

export const phoneUpiRule: CorrelationRule = {
  id: 'R_PHONE_UPI',
  evaluate: (record: any) => {
    const res: CandidateRelationship[] = [];
    const data = (record.normalizedData as any) || {};
    if (data.sourcePhone && data.upiId) {
      const c = createCandidate(EntityType.PHONE, data.sourcePhone, EntityType.UPI, data.upiId, RelationshipType.USES, Confidence.HIGH, 'Explicit association of Phone and UPI', record.id, 'R_PHONE_UPI');
      if (c) res.push(c);
    }
    return res;
  }
};

export const allRules = [
  telecomDeviceRule,
  communicationRule,
  financialFlowRule,
  upiBankRule,
  deviceNetworkRule,
  phoneUpiRule
];
