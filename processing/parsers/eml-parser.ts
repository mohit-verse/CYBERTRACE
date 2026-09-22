/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';
import { simpleParser } from 'mailparser';

export class EmlParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'EMAIL' && input.fileFormat.toLowerCase() === '.eml';
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const result: ParseResult = {
      records: [],
      warnings: [],
      errors: [],
      statistics: { total: 0, success: 0, rejected: 0 }
    };

    try {
      result.statistics.total = 1; // An EML file is usually one record representing the email

      const parsed = await simpleParser(input.buffer);
      
      const normalizedData = {
        messageId: parsed.messageId,
        from: parsed.from ? parsed.from.text : undefined,
        to: Array.isArray(parsed.to) ? parsed.to.map((t: any) => t.text).join(', ') : (parsed.to as any)?.text,
        subject: parsed.subject,
        date: parsed.date,
        headers: {} as Record<string, any>
      };

      // Extract specific headers like Received, Authentication-Results, etc.
      if (parsed.headers) {
        parsed.headers.forEach((value: any, key: string) => {
          normalizedData.headers[key] = value;
        });
      }

      result.records.push({
        sourceRecordId: parsed.messageId || `EML-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        recordType: 'EMAIL_HEADER',
        recordTimestamp: parsed.date || undefined,
        normalizedData,
        rawReference: 'Root EML Object'
      });

      result.statistics.success++;
    } catch (e: any) {
      result.statistics.rejected++;
      result.errors.push(`Failed to parse EML: ${e.message}`);
    }

    return result;
  }
}
