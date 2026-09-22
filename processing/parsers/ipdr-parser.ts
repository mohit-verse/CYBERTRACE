/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export class IpdrParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'IPDR' && ['.csv', '.xlsx'].includes(input.fileFormat.toLowerCase());
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const result: ParseResult = {
      records: [],
      warnings: [],
      errors: [],
      statistics: { total: 0, success: 0, rejected: 0 }
    };

    try {
      if (input.fileFormat.toLowerCase() === '.csv') {
        this.parseCsv(input.buffer, result);
      } else if (input.fileFormat.toLowerCase() === '.xlsx') {
        this.parseXlsx(input.buffer, result);
      }
    } catch (e: any) {
      result.errors.push(`Failed to parse IPDR: ${e.message}`);
    }

    return result;
  }

  private parseCsv(buffer: Buffer, result: ParseResult) {
    const content = buffer.toString('utf-8');
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    
    result.statistics.total = parsed.data.length;

    parsed.data.forEach((row: any, index: number) => {
      this.processRow(row, `CSV row ${index + 1}`, result);
    });
  }

  private parseXlsx(buffer: Buffer, result: ParseResult) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    result.statistics.total = data.length;

    data.forEach((row: any, index: number) => {
      this.processRow(row, `Sheet: ${sheetName}, Row: ${index + 2}`, result);
    });
  }

  private processRow(row: any, rawReference: string, result: ParseResult) {
    const subscriberId = row['Subscriber ID'] || row['Phone'] || row['MSISDN'] || row['phone'];
    const ipAddress = row['IP Address'] || row['IP'] || row['ip_address'];
    const timestampRaw = row['Timestamp'] || row['time'] || row['timestamp'];
    const destination = row['Destination'] || row['Remote IP'] || row['Target IP'];
    const sessionInfo = row['Session Info'] || row['Bytes'];

    if (!subscriberId && !ipAddress) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Missing subscriber ID and IP`);
      return;
    }

    let timestamp: Date | undefined;
    if (timestampRaw) {
      const parsedTime = new Date(timestampRaw);
      if (!isNaN(parsedTime.getTime())) timestamp = parsedTime;
    }

    const normalizedData = {
      subscriberId: subscriberId?.toString(),
      ipAddress: ipAddress?.toString(),
      timestamp: timestampRaw,
      destination: destination?.toString(),
      sessionInfo: sessionInfo?.toString()
    };

    result.records.push({
      sourceRecordId: `IPDR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recordType: 'IPDR',
      recordTimestamp: timestamp,
      normalizedData,
      rawReference
    });

    result.statistics.success++;
  }
}
