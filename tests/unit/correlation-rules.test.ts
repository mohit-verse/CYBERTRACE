import { EntityType, RelationshipType, Confidence } from '@prisma/client';
import { telecomDeviceRule, communicationRule, financialFlowRule } from '@/lib/correlation/rules';

describe('Correlation Rules Unit Tests', () => {
  it('telecomDeviceRule evaluates CDR correctly', () => {
    const record = {
      id: 'rec1',
      recordType: 'CDR',
      normalizedData: {
        canonical: {
          sourcePhone: 'P1',
          targetPhone: 'P2',
          sourceImei: 'IMEI1',
          targetImsi: 'IMSI2'
        }
      }
    };
    
    const candidates = telecomDeviceRule.evaluate(record);
    expect(candidates).toHaveLength(2);
    expect(candidates.find(c => c.sourceCanonicalValue === 'P1' && c.targetCanonicalValue === 'IMEI1' && c.relationshipType === RelationshipType.USES)).toBeDefined();
    expect(candidates.find(c => c.sourceCanonicalValue === 'P2' && c.targetCanonicalValue === 'IMSI2' && c.relationshipType === RelationshipType.HAS)).toBeDefined();
  });

  it('communicationRule evaluates CDR correctly', () => {
    const record = {
      id: 'rec2',
      recordType: 'CDR',
      normalizedData: {
        canonical: { sourcePhone: 'P1', targetPhone: 'P2' }
      }
    };
    const candidates = communicationRule.evaluate(record);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].relationshipType).toBe(RelationshipType.CALLED);
  });

  it('financialFlowRule evaluates BANK_TRANSACTION correctly', () => {
    const record = {
      id: 'rec3',
      recordType: 'BANK_TRANSACTION',
      normalizedData: {
        canonical: { sourceAccount: 'A1', destinationAccount: 'A2', transactionReference: 'TXN1' }
      }
    };
    const candidates = financialFlowRule.evaluate(record);
    expect(candidates).toHaveLength(3); // A1 -> A2, TXN1 -> A1, TXN1 -> A2
    expect(candidates.find(c => c.sourceCanonicalValue === 'A1' && c.targetCanonicalValue === 'A2' && c.relationshipType === RelationshipType.TRANSFERRED_TO)).toBeDefined();
    expect(candidates.find(c => c.sourceCanonicalValue === 'TXN1' && c.targetCanonicalValue === 'A1' && c.relationshipType === RelationshipType.FROM)).toBeDefined();
    expect(candidates.find(c => c.sourceCanonicalValue === 'TXN1' && c.targetCanonicalValue === 'A2' && c.relationshipType === RelationshipType.TO)).toBeDefined();
  });

  it('ignores missing data', () => {
    const record = { id: 'rec4', recordType: 'CDR', normalizedData: { canonical: {} } };
    expect(telecomDeviceRule.evaluate(record)).toHaveLength(0);
    expect(communicationRule.evaluate(record)).toHaveLength(0);
    expect(financialFlowRule.evaluate(record)).toHaveLength(0);
  });
});
