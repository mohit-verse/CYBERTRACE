/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { normalizers } from '@/processing/normalizers';

describe('Normalizers', () => {
  it('PhoneNormalizer: formats Indian numbers correctly', () => {
    const norm = normalizers.phone;
    expect(norm.normalize('+91 98765-43210').canonicalValue).toBe('9876543210');
    expect(norm.normalize('919876543210').canonicalValue).toBe('9876543210');
    expect(norm.normalize('09876543210').canonicalValue).toBe('9876543210');
    expect(norm.normalize('9876543210').canonicalValue).toBe('9876543210');
    expect(norm.normalize('invalid_phone').error).toBe('Invalid phone format');
  });

  it('UpiNormalizer: lowercases and trims', () => {
    const norm = normalizers.upi;
    expect(norm.normalize(' MuleA001@UPI ').canonicalValue).toBe('mulea001@upi');
    expect(norm.normalize('MuleA001').error).toBe('Malformed UPI ID (missing @)');
  });

  it('EmailNormalizer: lowercases correctly', () => {
    const norm = normalizers.email;
    expect(norm.normalize(' User@EXAMPLE.COM ').canonicalValue).toBe('user@example.com');
    expect(norm.normalize('userexample.com').error).toBe('Malformed email address');
  });

  it('IpNormalizer: validates IP addresses', () => {
    const norm = normalizers.ip;
    expect(norm.normalize(' 192.168.1.1 ').canonicalValue).toBe('192.168.1.1');
    expect(norm.normalize('999.999.999.999').error).toBe('Invalid IP address format');
  });

  it('MacNormalizer: canonicalizes MAC addresses', () => {
    const norm = normalizers.mac;
    expect(norm.normalize('aa-bb-cc-dd-ee-ff').canonicalValue).toBe('AA:BB:CC:DD:EE:FF');
    expect(norm.normalize('AABB.CCDD.EEFF').error).toBe('Invalid MAC address format'); // Wait, rules just said replace /[:-]/ so dots might fail length test if stripped or kept. Let's see: replace removes : -, length check will be 14 if dots remain.
    expect(norm.normalize('AABBCCDDEEFF').canonicalValue).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('TimestampNormalizer: parses valid dates', () => {
    const norm = normalizers.timestamp;
    const res = norm.normalize('2026-09-22T10:00:00Z');
    expect(res.canonicalValue).toBe('2026-09-22T10:00:00.000Z');
    expect(norm.normalize('invalid_date').error).toBe('Invalid timestamp format');
  });

  it('MonetaryNormalizer: handles precision', () => {
    const norm = normalizers.monetary;
    expect(norm.normalize(' 1,234.567 ').canonicalValue).toBe(1234.57);
    expect(norm.normalize(1234.567).canonicalValue).toBe(1234.57);
    expect(norm.normalize('not_money').error).toBe('Malformed monetary value');
  });

  it('AccountNormalizer: preserves leading zeros, strips hyphens', () => {
    const norm = normalizers.account;
    expect(norm.normalize(' 00123-456 ').canonicalValue).toBe('00123456');
  });
});
