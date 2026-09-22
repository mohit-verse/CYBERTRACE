/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParserInput } from './types';
import { CdrParser } from './cdr-parser';
import { IpdrParser } from './ipdr-parser';
import { BankTransactionParser } from './bank-parser';
import { UpiTransactionParser } from './upi-parser';
import { AndroidLogParser } from './android-parser';
import { EmlParser } from './eml-parser';

export class ParserRegistry {
  private parsers: ArtifactParser[] = [
    new CdrParser(),
    new IpdrParser(),
    new BankTransactionParser(),
    new UpiTransactionParser(),
    new AndroidLogParser(),
    new EmlParser(),
  ];

  /**
   * Deterministically select a parser for the given input evidence.
   */
  getParser(input: ParserInput): ArtifactParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(input)) {
        return parser;
      }
    }
    return null; // No suitable parser found
  }
}

export const parserRegistry = new ParserRegistry();
