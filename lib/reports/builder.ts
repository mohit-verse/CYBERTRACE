/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { reportContextBuilder } from './context-builder';
import { reportValidator } from './validator';
import { jsonReportGenerator } from './json';
import { pdfReportGenerator } from './pdf';
import { getAIProvider, contextBuilder as aiContextBuilder } from '@/lib/ai';

export class ReportBuilder {
  async generate(caseId: string, reportId: string, requestAiNarrative: boolean = false) {
    const report = await reportContextBuilder.build(caseId, reportId);

    // Optional AI narrative
    if (requestAiNarrative) {
      try {
        const aiProvider = getAIProvider();
        const aiContext = await aiContextBuilder.buildContext(caseId, 'Summarize the key findings.', 'CASE_SUMMARY');
        const aiResponse = await aiProvider.generateResponse(aiContext, 'Provide a brief executive summary of this case based on the findings and risk.', 'CASE_SUMMARY');
        report.aiNarrative = aiResponse.answer;
      } catch (err) {
        report.aiNarrative = 'AI narrative unavailable (Service error).';
      }
    }

    reportValidator.validate(report);

    const json = jsonReportGenerator.generate(report);
    const pdfBuffer = await pdfReportGenerator.generate(report);

    return { json, pdfBuffer };
  }
}
export const reportBuilder = new ReportBuilder();
