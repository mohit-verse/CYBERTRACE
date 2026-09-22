import { StructuredReport } from './types';

export class JsonReportGenerator {
  generate(report: StructuredReport): string {
    // Basic JSON stringification with indentation for readability
    return JSON.stringify(report, null, 2);
  }
}
export const jsonReportGenerator = new JsonReportGenerator();
