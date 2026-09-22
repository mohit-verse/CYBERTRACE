/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export class CdrParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'CDR' && ['.csv', '.xlsx'].includes(input.fileFormat.toLowerCase());
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
      result.errors.push(`Failed to parse CDR: ${e.message}`);
    }

    return result;
  }

  private parseCsv(buffer: Buffer, result: ParseResult) {
    const content = buffer.toString('utf-8');
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    
    result.statistics.total = parsed.data.length;

    if (parsed.errors.length > 0) {
      parsed.errors.forEach(err => result.warnings.push(`CSV Row ${err.row}: ${err.message}`));
    }

    parsed.data.forEach((row: any, index: number) => {
      this.processRow(row, `CSV Row ${index + 1}`, result);
    });
  }

  private parseXlsx(buffer: Buffer, result: ParseResult) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Take first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    result.statistics.total = data.length;

    data.forEach((row: any, index: number) => {
      this.processRow(row, `Sheet: ${sheetName}, Row: ${index + 2}`, result); // +2 for 1-based and header offset
    });
  }

  private processRow(row: any, rawReference: string, result: ParseResult) {
    // Normalization mappings for CDR fields, extracting loosely
    const callingNumber = row['Calling Number'] || row['sourcePhone'] || row['from'] || row['caller'];
    const calledNumber = row['Called Number'] || row['targetPhone'] || row['to'] || row['receiver'];
    const timestampRaw = row['Timestamp'] || row['time'] || row['date'] || row['timestamp'];
    const duration = row['Duration'] || row['duration_seconds'];
    const direction = row['Direction'] || row['Call Type'];
    const imei = row['IMEI'] || row['imei'];
    const imsi = row['IMSI'] || row['imsi'];

    if (!callingNumber && !calledNumber) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Missing calling/called numbers`);
      return;
    }

    let timestamp: Date | undefined;
    if (timestampRaw) {
      const parsedTime = new Date(timestampRaw);
      if (!isNaN(parsedTime.getTime())) {
        timestamp = parsedTime;
      }
    }

    const normalizedData = {
      sourcePhone: callingNumber?.toString(),
      targetPhone: calledNumber?.toString(),
      timestamp: timestampRaw,
      duration: duration ? parseFloat(duration) : undefined,
      direction: direction?.toString(),
      sourceImei: imei?.toString(), // Simple fallback since our mock data doesn't distinguish source/target imei
      sourceImsi: imsi?.toString()
    };

    result.records.push({
      sourceRecordId: `CDR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recordType: 'CDR',
      recordTimestamp: timestamp,
      normalizedData,
      rawReference
    });

    result.statistics.success++;
  }
}
