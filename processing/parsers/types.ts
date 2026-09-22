/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactType } from '@prisma/client';

export interface ParseResult {
  records: ParsedRecord[];
  warnings: string[];
  errors: string[];
  statistics: {
    total: number;
    success: number;
    rejected: number;
  };
}

export interface ParsedRecord {
  sourceRecordId: string;
  recordType: string;
  recordTimestamp?: Date;
  normalizedData: any;
  rawReference: string;
}

export interface ParserInput {
  evidenceId: string;
  artifactType: ArtifactType;
  originalFilename: string;
  fileFormat: string;
  buffer: Buffer;
}

export interface ArtifactParser {
  canParse(input: ParserInput): boolean;
  parse(input: ParserInput): Promise<ParseResult>;
}
