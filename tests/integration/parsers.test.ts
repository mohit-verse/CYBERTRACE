/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { CdrParser } from '@/processing/parsers/cdr-parser';
import { IpdrParser } from '@/processing/parsers/ipdr-parser';
import { BankTransactionParser } from '@/processing/parsers/bank-parser';
import { UpiTransactionParser } from '@/processing/parsers/upi-parser';
import { AndroidLogParser } from '@/processing/parsers/android-parser';
import { EmlParser } from '@/processing/parsers/eml-parser';
import { ParserInput } from '@/processing/parsers/types';

describe('Parsers Foundation', () => {

  it('CDR Parser: processes valid CSV', async () => {
    const parser = new CdrParser();
    const csvContent = `Calling Number,Called Number,Timestamp,Duration,Direction\n9876500001,9876500002,2026-09-22T10:00:00Z,120,OUTGOING`;
    
    const input: ParserInput = {
      evidenceId: 'test-cdr',
      artifactType: 'CDR',
      originalFilename: 'test.csv',
      fileFormat: '.csv',
      buffer: Buffer.from(csvContent)
    };

    expect(parser.canParse(input)).toBe(true);
    
    const result = await parser.parse(input);
    expect(result.statistics.total).toBe(1);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].recordType).toBe('CDR');
    expect(result.records[0].normalizedData.sourcePhone).toBe('9876500001');
    expect(result.records[0].normalizedData.targetPhone).toBe('9876500002');
  });

  it('IPDR Parser: processes valid CSV', async () => {
    const parser = new IpdrParser();
    const csvContent = `Subscriber ID,IP Address,Timestamp,Destination,Session Info\nSUB001,192.168.1.1,2026-09-22T10:00:00Z,10.0.0.1,10MB`;
    
    const input: ParserInput = {
      evidenceId: 'test-ipdr',
      artifactType: 'IPDR',
      originalFilename: 'test.csv',
      fileFormat: '.csv',
      buffer: Buffer.from(csvContent)
    };

    const result = await parser.parse(input);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].normalizedData.ipAddress).toBe('192.168.1.1');
    expect(result.records[0].normalizedData.subscriberId).toBe('SUB001');
  });

  it('Bank Transaction Parser: processes valid CSV', async () => {
    const parser = new BankTransactionParser();
    const csvContent = `Transaction Reference,Source Account,Destination Account,Amount,Currency,Timestamp\nTXN123,ACC1,ACC2,500.50,INR,2026-09-22T10:00:00Z`;
    
    const input: ParserInput = {
      evidenceId: 'test-bank',
      artifactType: 'BANK_TRANSACTION',
      originalFilename: 'test.csv',
      fileFormat: '.csv',
      buffer: Buffer.from(csvContent)
    };

    const result = await parser.parse(input);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].normalizedData.amount).toBe(500.5);
    expect(result.records[0].normalizedData.transactionReference).toBe('TXN123');
  });

  it('UPI Transaction Parser: processes valid CSV', async () => {
    const parser = new UpiTransactionParser();
    const csvContent = `Transaction Reference,Payer,Payee,UPI ID,Amount,Timestamp,Status\nUPI123,Payer1,Payee1,user@upi,100,2026-09-22T10:00:00Z,SUCCESS`;
    
    const input: ParserInput = {
      evidenceId: 'test-upi',
      artifactType: 'UPI_TRANSACTION',
      originalFilename: 'test.csv',
      fileFormat: '.csv',
      buffer: Buffer.from(csvContent)
    };

    const result = await parser.parse(input);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].normalizedData.upiId).toBe('user@upi');
    expect(result.records[0].normalizedData.amount).toBe(100);
  });

  it('Android Log Parser: processes valid JSON logs', async () => {
    const parser = new AndroidLogParser();
    const jsonContent = JSON.stringify([
      { timestamp: '2026-09-22T10:00:00Z', deviceId: 'DEV1', ip: '1.1.1.1', event: 'APP_OPEN' }
    ]);
    
    const input: ParserInput = {
      evidenceId: 'test-android',
      artifactType: 'ANDROID_LOG',
      originalFilename: 'test.json',
      fileFormat: '.json',
      buffer: Buffer.from(jsonContent)
    };

    const result = await parser.parse(input);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].normalizedData.deviceId).toBe('DEV1');
    expect(result.records[0].normalizedData.eventType).toBe('APP_OPEN');
  });

  it('EML Parser: handles basic email structure gracefully', async () => {
    const parser = new EmlParser();
    // A minimal valid EML mock
    const emlContent = `From: sender@example.com\r\nTo: recipient@example.com\r\nSubject: Test\r\nMessage-ID: <1234@local.machine>\r\nDate: Tue, 22 Sep 2026 10:00:00 +0000\r\n\r\nBody text`;
    
    const input: ParserInput = {
      evidenceId: 'test-eml',
      artifactType: 'EMAIL',
      originalFilename: 'test.eml',
      fileFormat: '.eml',
      buffer: Buffer.from(emlContent)
    };

    const result = await parser.parse(input);
    expect(result.statistics.success).toBe(1);
    expect(result.records[0].normalizedData.subject).toBe('Test');
    expect(result.records[0].normalizedData.from).toBe('sender@example.com');
  });
});
