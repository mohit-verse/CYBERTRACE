/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export class BankTransactionParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'BANK_TRANSACTION' && ['.csv', '.xlsx'].includes(input.fileFormat.toLowerCase());
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
      result.errors.push(`Failed to parse Bank Transactions: ${e.message}`);
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
    const txRef = row['Transaction Reference'] || row['Txn Ref'] || row['Reference No'] || row['transaction_id'];
    const sourceAcc = row['Source Account'] || row['Account No'] || row['From'] || row['source_account'];
    const destAcc = row['Destination Account'] || row['Beneficiary'] || row['To'] || row['destination_account'];
    const amountStr = row['Amount'] || row['Withdrawal'] || row['Deposit'] || row['amount'];
    const currency = row['Currency'] || row['currency'] || 'INR';
    const timestampRaw = row['Timestamp'] || row['Date'] || row['Txn Date'] || row['timestamp'];
    const description = row['Description'] || row['Narration'] || row['Remarks'] || row['channel'];

    if (!amountStr || (!sourceAcc && !destAcc)) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Missing essential transaction fields (amount or accounts)`);
      return;
    }

    let timestamp: Date | undefined;
    if (timestampRaw) {
      const parsedTime = new Date(timestampRaw);
      if (!isNaN(parsedTime.getTime())) timestamp = parsedTime;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Malformed amount`);
      return;
    }

    const normalizedData = {
      transactionReference: txRef?.toString(),
      sourceAccount: sourceAcc?.toString(),
      destinationAccount: destAcc?.toString(),
      amount: amount,
      currency: currency?.toString(),
      timestamp: timestampRaw,
      description: description?.toString()
    };

    result.records.push({
      sourceRecordId: txRef ? txRef.toString() : `BANK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recordType: 'BANK_TRANSACTION',
      recordTimestamp: timestamp,
      normalizedData,
      rawReference
    });

    result.statistics.success++;
  }
}
