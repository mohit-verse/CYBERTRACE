/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityExtractor } from '@/lib/entities/extractor';
import { EntityType } from '@prisma/client';

describe('Entity Extractor Unit Tests', () => {
  const extractor = new EntityExtractor();

  it('extracts CDR correctly', () => {
    const record: any = {
      id: 'rec-1',
      recordType: 'CDR',
      normalizedData: {
        canonical: {
          sourcePhone: '11111',
          targetPhone: '22222',
          sourceImei: 'IMEI1'
        },
        sourcePhone: ' 11111 ',
        targetPhone: ' 22222',
        sourceImei: 'IMEI1'
      }
    };

    const candidates = extractor.extract(record);
    expect(candidates).toHaveLength(3);
    expect(candidates.find(c => c.type === EntityType.PHONE && c.canonicalValue === '11111')).toBeDefined();
    expect(candidates.find(c => c.type === EntityType.PHONE && c.canonicalValue === '22222')).toBeDefined();
    expect(candidates.find(c => c.type === EntityType.IMEI && c.canonicalValue === 'IMEI1')).toBeDefined();
  });

  it('extracts IPDR correctly', () => {
    const record: any = {
      id: 'rec-2',
      recordType: 'IPDR',
      normalizedData: {
        canonical: {
          subscriberId: '9876543210',
          ipAddress: '192.168.1.1'
        },
        subscriberId: '9876543210',
        ipAddress: ' 192.168.1.1 '
      }
    };
    
    const candidates = extractor.extract(record);
    expect(candidates).toHaveLength(2);
    expect(candidates.find(c => c.type === EntityType.PHONE && c.canonicalValue === '9876543210')).toBeDefined();
    expect(candidates.find(c => c.type === EntityType.IP && c.canonicalValue === '192.168.1.1')).toBeDefined();
  });

  it('extracts Android Log correctly', () => {
    const record: any = {
      id: 'rec-3',
      recordType: 'ANDROID_LOG',
      normalizedData: {
        canonical: {
          macAddress: 'AA:BB:CC:DD:EE:FF',
          deviceId: 'DEV123'
        },
        macAddress: 'aa-bb-cc-dd-ee-ff',
        deviceId: 'DEV123'
      }
    };
    
    const candidates = extractor.extract(record);
    expect(candidates).toHaveLength(2);
    expect(candidates.find(c => c.type === EntityType.MAC && c.canonicalValue === 'AA:BB:CC:DD:EE:FF')).toBeDefined();
    expect(candidates.find(c => c.type === EntityType.DEVICE && c.canonicalValue === 'DEV123')).toBeDefined();
  });

  it('ignores empty values', () => {
    const record: any = {
      id: 'rec-4',
      recordType: 'CDR',
      normalizedData: {
        canonical: {
          sourcePhone: '',
          targetPhone: null
        }
      }
    };
    const candidates = extractor.extract(record);
    expect(candidates).toHaveLength(0);
  });
});
