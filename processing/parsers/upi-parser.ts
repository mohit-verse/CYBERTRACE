/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ArtifactParser, ParsedRecord, ParserInput, ParseResult } from './types';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export class UpiTransactionParser implements ArtifactParser {
  canParse(input: ParserInput): boolean {
    return input.artifactType === 'UPI_TRANSACTION' && ['.csv', '.xlsx'].includes(input.fileFormat.toLowerCase());
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
      result.errors.push(`Failed to parse UPI Transactions: ${e.message}`);
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
    const txRef = row['Transaction Reference'] || row['Txn ID'] || row['Reference No'] || row['transaction_id'];
    const payer = row['Payer'] || row['From UPI ID'] || row['Source'] || row['source_upi'];
    const payee = row['Payee'] || row['To UPI ID'] || row['Destination'] || row['destination_upi'];
    const upiId = row['UPI ID'] || row['VPA'];
    const amountStr = row['Amount'] || row['amount'];
    const timestampRaw = row['Timestamp'] || row['Date'] || row['timestamp'];
    const status = row['Status'];

    if (!txRef && !payer && !payee && !amountStr) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Missing essential fields`);
      return;
    }

    let timestamp: Date | undefined;
    if (timestampRaw) {
      const parsedTime = new Date(timestampRaw);
      if (!isNaN(parsedTime.getTime())) timestamp = parsedTime;
    }

    const amount = amountStr ? parseFloat(amountStr) : undefined;
    if (amountStr && isNaN(amount as number)) {
      result.statistics.rejected++;
      result.warnings.push(`Rejected ${rawReference}: Malformed amount`);
      return;
    }

    const normalizedData = {
      transactionReference: txRef?.toString(),
      payerUpiId: payer?.toString(), // FIX: was 'payer' which extractor doesn't look for!
      payeeUpiId: payee?.toString(), // FIX: was 'payee' which extractor doesn't look for!
      upiId: upiId?.toString() || payer?.toString(),
      amount,
      timestamp: timestampRaw,
      status: status?.toString()
    };

    result.records.push({
      sourceRecordId: txRef ? txRef.toString() : `UPI-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      recordType: 'UPI_TRANSACTION',
      recordTimestamp: timestamp,
      normalizedData,
      rawReference
    });

    result.statistics.success++;
  }
}
