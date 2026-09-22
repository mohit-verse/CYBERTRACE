import { EntityType, EvidenceRecord } from '@prisma/client';

export interface ExtractedEntityCandidate {
  type: EntityType;
  canonicalValue: string;
  displayValue?: string;
  sourceRecordId: string;
}

export class EntityExtractor {
  extract(record: EvidenceRecord): ExtractedEntityCandidate[] {
    const candidates: ExtractedEntityCandidate[] = [];

    if (!record.normalizedData) return candidates;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = record.normalizedData as any;
    const canonical = data.canonical || {};

    const addCandidate = (type: EntityType, value: unknown, display?: unknown) => {
      if (value) {
        candidates.push({
          type,
          canonicalValue: String(value).trim(),
          displayValue: display ? String(display).trim() : undefined,
          sourceRecordId: record.id
        });
      }
    };

    switch (record.recordType) {
      case 'CDR':
        addCandidate(EntityType.PHONE, canonical.sourcePhone || data.sourcePhone, data.sourcePhone);
        addCandidate(EntityType.PHONE, canonical.targetPhone || data.targetPhone, data.targetPhone);
        if (canonical.sourceImei || data.sourceImei) addCandidate(EntityType.IMEI, canonical.sourceImei || data.sourceImei, data.sourceImei);
        if (canonical.targetImei || data.targetImei) addCandidate(EntityType.IMEI, canonical.targetImei || data.targetImei, data.targetImei);
        if (canonical.sourceImsi || data.sourceImsi) addCandidate(EntityType.IMSI, canonical.sourceImsi || data.sourceImsi, data.sourceImsi);
        if (canonical.targetImsi || data.targetImsi) addCandidate(EntityType.IMSI, canonical.targetImsi || data.targetImsi, data.targetImsi);
        break;

      case 'IPDR':
        if (canonical.subscriberId || data.subscriberId) {
          addCandidate(EntityType.PHONE, canonical.subscriberId || data.subscriberId, data.subscriberId);
        }
        addCandidate(EntityType.IP, canonical.ipAddress || data.ipAddress, data.ipAddress);
        break;

      case 'BANK_TRANSACTION':
        addCandidate(EntityType.BANK_ACCOUNT, canonical.sourceAccount || data.sourceAccount, data.sourceAccount);
        addCandidate(EntityType.BANK_ACCOUNT, canonical.destinationAccount || data.destinationAccount, data.destinationAccount);
        addCandidate(EntityType.TRANSACTION, canonical.transactionReference || data.transactionReference, data.transactionReference);
        break;

      case 'UPI_TRANSACTION':
        addCandidate(EntityType.UPI, canonical.upiId || data.upiId, data.upiId);
        if (canonical.payerUpiId || data.payerUpiId) addCandidate(EntityType.UPI, canonical.payerUpiId || data.payerUpiId, data.payerUpiId);
        if (canonical.payeeUpiId || data.payeeUpiId) addCandidate(EntityType.UPI, canonical.payeeUpiId || data.payeeUpiId, data.payeeUpiId);
        addCandidate(EntityType.TRANSACTION, canonical.transactionReference || data.transactionReference, data.transactionReference);
        break;

      case 'EMAIL_HEADER':
        addCandidate(EntityType.EMAIL, canonical.from || data.from, data.from);
        if (canonical.to || data.to) {
          const toField = String(canonical.to || data.to);
          const emails = toField.split(',');
          emails.forEach(e => addCandidate(EntityType.EMAIL, e.trim()));
        }
        break;

      case 'ANDROID_LOG':
        addCandidate(EntityType.IP, canonical.ipAddress || data.ipAddress, data.ipAddress);
        addCandidate(EntityType.MAC, canonical.macAddress || data.macAddress, data.macAddress);
        if (canonical.imei || data.imei) addCandidate(EntityType.IMEI, canonical.imei || data.imei, data.imei);
        if (canonical.imsi || data.imsi) addCandidate(EntityType.IMSI, canonical.imsi || data.imsi, data.imsi);
        if (canonical.deviceId || data.deviceId) addCandidate(EntityType.DEVICE, canonical.deviceId || data.deviceId, data.deviceId);
        break;
    }

    // Deduplicate candidates from the same record
    const uniqueCandidates = new Map<string, ExtractedEntityCandidate>();
    for (const c of candidates) {
      const key = `${c.type}:${c.canonicalValue}`;
      if (!uniqueCandidates.has(key)) {
        uniqueCandidates.set(key, c);
      }
    }

    return Array.from(uniqueCandidates.values());
  }
}
