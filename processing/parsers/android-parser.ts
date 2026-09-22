/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';

export class AndroidLogParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'ANDROID_LOG' && ['.json', '.txt', '.log'].includes(input.fileFormat.toLowerCase());
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const result: ParseResult = {
      records: [],
      warnings: [],
      errors: [],
      statistics: { total: 0, success: 0, rejected: 0 }
    };

    try {
      if (input.fileFormat.toLowerCase() === '.json') {
        this.parseJson(input.buffer, result);
      } else {
        this.parseTxt(input.buffer, result);
      }
    } catch (e: any) {
      result.errors.push(`Failed to parse Android Log: ${e.message}`);
    }

    return result;
  }

  private parseJson(buffer: Buffer, result: ParseResult) {
    const content = buffer.toString('utf-8');
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format');
    }

    let events: any[] = [];
    let jsonPathPrefix = '';

    if (Array.isArray(data)) {
      events = data;
      jsonPathPrefix = '$';
    } else if (data.events && Array.isArray(data.events)) {
      events = data.events;
      jsonPathPrefix = '$.events';
    } else if (data.logs && Array.isArray(data.logs)) {
      events = data.logs;
      jsonPathPrefix = '$.logs';
    } else {
      // Treat as single record
      events = [data];
      jsonPathPrefix = '$';
    }

    result.statistics.total = events.length;

    events.forEach((event: any, index: number) => {
      this.processRow(event, `${jsonPathPrefix}[${index}]`, result);
    });
  }

  private parseTxt(buffer: Buffer, result: ParseResult) {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    result.statistics.total = lines.length;

    lines.forEach((line: string, index: number) => {
      this.processRow({ logLine: line }, `Line ${index + 1}`, result);
    });
  }

  private processRow(row: any, rawReference: string, result: ParseResult) {
    const timestampRaw = row.timestamp || row.time || row.date || undefined;
    const deviceId = row.deviceId || row.device_id || row.androidId || row.android_id;
    const imei = row.imei;
    const ipAddress = row.ipAddress || row.ip || row.ip_address;
    const macAddress = row.macAddress || row.mac || row.mac_address;
    const eventType = row.eventType || row.event_type || row.type || row.action;

    let timestamp: Date | undefined;
    if (timestampRaw) {
      const parsedTime = new Date(timestampRaw);
      if (!isNaN(parsedTime.getTime())) timestamp = parsedTime;
    }

    const normalizedData = {
      timestamp: timestampRaw,
      deviceId: deviceId?.toString(),
      imei: imei?.toString(), // added for extractor
      ipAddress: ipAddress?.toString(),
      macAddress: macAddress?.toString(), // added for extractor
      eventType: eventType?.toString(),
      rawObject: row
    };

    result.records.push({
      sourceRecordId: `ANDLOG-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recordType: 'ANDROID_LOG',
      recordTimestamp: timestamp,
      normalizedData,
      rawReference
    });

    result.statistics.success++;
  }
}
