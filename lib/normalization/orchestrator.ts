import prisma from '@/lib/db';
import { normalizers } from '@/processing/normalizers';

export class NormalizationOrchestrator {
  /**
   * Normalizes a batch of EvidenceRecords based on their recordType.
   * Updates the normalizedData in place.
   */
  async normalizeCaseEvidence(caseId: string): Promise<void> {
    const records = await prisma.evidenceRecord.findMany({
      where: { evidenceFile: { caseId } }
    });

    for (const record of records) {
      if (!record.normalizedData) continue;
      
      const data = record.normalizedData as Record<string, unknown>;
      const canonical: Record<string, unknown> = {};
      const errors: string[] = [];
      const original: Record<string, unknown> = { ...data };

      // Apply canonical rules based on the record type
      switch (record.recordType) {
        case 'CDR':
          if (data.sourcePhone) this.applyNorm(canonical, errors, 'sourcePhone', normalizers.phone.normalize(data.sourcePhone));
          if (data.targetPhone) this.applyNorm(canonical, errors, 'targetPhone', normalizers.phone.normalize(data.targetPhone));
          if (data.timestamp) this.applyNorm(canonical, errors, 'timestamp', normalizers.timestamp.normalize(data.timestamp));
          break;

        case 'IPDR':
          if (data.subscriberId) {
            // Usually a phone number in this context, but could be account
            const res = normalizers.phone.normalize(data.subscriberId);
            if (!res.error) this.applyNorm(canonical, errors, 'subscriberId', res);
            else canonical.subscriberId = data.subscriberId; // leave as is if not phone
          }
          if (data.ipAddress) this.applyNorm(canonical, errors, 'ipAddress', normalizers.ip.normalize(data.ipAddress));
          if (data.timestamp) this.applyNorm(canonical, errors, 'timestamp', normalizers.timestamp.normalize(data.timestamp));
          break;

        case 'BANK_TRANSACTION':
          if (data.sourceAccount) this.applyNorm(canonical, errors, 'sourceAccount', normalizers.account.normalize(data.sourceAccount));
          if (data.destinationAccount) this.applyNorm(canonical, errors, 'destinationAccount', normalizers.account.normalize(data.destinationAccount));
          if (data.amount) this.applyNorm(canonical, errors, 'amount', normalizers.monetary.normalize(data.amount));
          if (data.timestamp) this.applyNorm(canonical, errors, 'timestamp', normalizers.timestamp.normalize(data.timestamp));
          // transactionReference just formatting trimmed
          if (data.transactionReference) canonical.transactionReference = String(data.transactionReference).trim();
          break;

        case 'UPI_TRANSACTION':
          if (data.upiId) this.applyNorm(canonical, errors, 'upiId', normalizers.upi.normalize(data.upiId));
          if (data.amount) this.applyNorm(canonical, errors, 'amount', normalizers.monetary.normalize(data.amount));
          if (data.timestamp) this.applyNorm(canonical, errors, 'timestamp', normalizers.timestamp.normalize(data.timestamp));
          if (data.transactionReference) canonical.transactionReference = String(data.transactionReference).trim();
          break;

        case 'EMAIL_HEADER':
          if (data.from) this.applyNorm(canonical, errors, 'from', normalizers.email.normalize(data.from));
          // to might be a comma separated list, let's just do a basic map if we can, or keep original for now.
          if (data.to) {
            const emails = String(data.to).split(',').map(e => normalizers.email.normalize(e.trim()));
            canonical.to = emails.map(e => e.canonicalValue).join(', ');
          }
          if (data.date) this.applyNorm(canonical, errors, 'date', normalizers.timestamp.normalize(data.date));
          break;

        case 'ANDROID_LOG':
          if (data.ipAddress) this.applyNorm(canonical, errors, 'ipAddress', normalizers.ip.normalize(data.ipAddress));
          if (data.timestamp) this.applyNorm(canonical, errors, 'timestamp', normalizers.timestamp.normalize(data.timestamp));
          // MAC addresses might be inside rawObject, if extracted to a specific field:
          if (data.macAddress) this.applyNorm(canonical, errors, 'macAddress', normalizers.mac.normalize(data.macAddress));
          break;
      }

      // Merge canonical into normalizedData, keep original values
      const updatedData = {
        ...original,
        canonical: Object.keys(canonical).length > 0 ? canonical : undefined,
        normalizationErrors: errors.length > 0 ? errors : undefined
      };

      await prisma.evidenceRecord.update({
        where: { id: record.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { normalizedData: updatedData as any }
      });
    }
  }

  private applyNorm(canonical: Record<string, unknown>, errors: string[], key: string, res: { canonicalValue?: unknown, error?: string }) {
    if (res.error) {
      errors.push(`${key}: ${res.error}`);
    }
    if (res.canonicalValue !== undefined) {
      canonical[key] = res.canonicalValue;
    }
  }
}

export const normalizationOrchestrator = new NormalizationOrchestrator();
