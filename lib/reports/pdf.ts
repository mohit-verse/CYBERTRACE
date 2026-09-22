/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import PDFDocument from 'pdfkit';
import { StructuredReport } from './types';

export class PdfReportGenerator {
  async generate(report: StructuredReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('CYBERTRACE', { align: 'center' });
        doc.fontSize(16).text('Investigative Brief', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(10).font('Helvetica').text(`Report ID: ${report.metadata.reportId}`, { align: 'right' });
        doc.text(`Case Number: ${report.caseSummary.caseNumber}`, { align: 'right' });
        doc.text(`Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}`, { align: 'right' });
        doc.moveDown(2);

        // 1. Case Summary
        this.renderSectionHeader(doc, '1. Case Summary');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Title: ${report.caseSummary.title}`);
        doc.text(`Status: ${report.caseSummary.status}`);
        if (report.caseSummary.description) {
          doc.text(`Description: ${report.caseSummary.description}`);
        }
        doc.moveDown();

        // 2. Executive Investigation Summary
        this.renderSectionHeader(doc, '2. Executive Investigation Summary');
        doc.fontSize(10).font('Helvetica');
        const ex = report.executiveSummary;
        doc.text(`Evidence Files: ${ex.evidenceCount} | Entities: ${ex.entityCount} | Relationships: ${ex.relationshipCount}`);
        doc.text(`Transactions: ${ex.transactionCount} | Findings: ${ex.findingsCount}`);
        doc.text(`Critical Risk Entities: ${ex.criticalRiskCount} | High Risk Entities: ${ex.highRiskCount}`);
        doc.moveDown();

        // 3. Evidence & Integrity
        this.renderSectionHeader(doc, '3. Evidence & Integrity');
        report.evidenceSummary.forEach(e => {
          doc.font('Helvetica-Bold').fontSize(10).text(e.originalFilename);
          doc.font('Helvetica').fontSize(9);
          doc.text(`Type: ${e.artifactType} | Status: ${e.processingStatus}`);
          doc.text(`Integrity: ${e.integrityStatus}`);
          if (e.sha256) {
            doc.font('Courier').fontSize(8).text(`SHA-256: ${e.sha256}`);
          }
          doc.moveDown(0.5);
        });
        doc.moveDown();

        // 4. Prime Investigation Entities
        this.renderSectionHeader(doc, '4. Prime Investigation Entities');
        report.primeInvestigationEntities.forEach(p => {
          doc.font('Helvetica-Bold').fontSize(10).text(`${p.entity.type}: ${p.entity.canonicalValue} [${p.entity.riskSeverity}]`);
          doc.font('Helvetica').fontSize(9).text(`Reason: ${p.reason}`);
          doc.moveDown(0.5);
        });
        doc.moveDown();

        // 5. Transaction Flow
        this.renderSectionHeader(doc, '5. Transaction Flow');
        report.transactionFlow.forEach(t => {
          doc.font('Helvetica').fontSize(9);
          doc.text(`${t.transactionTimestamp || 'Unknown Time'} | ${t.sourceAccountEntityId || 'Unknown'} -> ${t.destinationAccountEntityId || 'Unknown'} : ${t.currency || ''} ${t.amount || '0'}`);
          if (t.transactionReference) doc.text(`Ref: ${t.transactionReference}`);
          doc.moveDown(0.5);
        });
        doc.moveDown();

        // 6. Risk Assessment
        this.renderSectionHeader(doc, '6. Risk Assessment');
        report.riskAssessments.forEach(ra => {
          doc.font('Helvetica-Bold').fontSize(10).text(`Entity ID: ${ra.entityId} | Score: ${ra.score} (${ra.severity})`);
          ra.factors.forEach(f => {
            doc.font('Helvetica').fontSize(9).text(` - ${f.factorType} (+${f.weight}): ${f.description}`);
          });
          doc.moveDown(0.5);
        });
        doc.moveDown();

        // 7. Findings
        this.renderSectionHeader(doc, '7. Findings');
        report.findings.forEach(f => {
          doc.font('Helvetica-Bold').fontSize(10).text(`${f.findingType} (${f.severity})`);
          doc.font('Helvetica').fontSize(9).text(f.description || 'No description');
          doc.moveDown(0.5);
        });
        doc.moveDown();

        // 8. Investigation Leads
        this.renderSectionHeader(doc, '8. Investigation Leads');
        report.investigationLeads.forEach(lead => {
          doc.font('Helvetica').fontSize(9).text(`- ${lead}`);
        });
        doc.moveDown();

        // 9. Data Quality & Limitations
        this.renderSectionHeader(doc, '9. Data Quality & Limitations');
        report.dataQuality.forEach(dq => {
          doc.font('Helvetica').fontSize(9).text(`- ${dq}`);
        });
        doc.moveDown();

        // 10. Contradictory Evidence
        this.renderSectionHeader(doc, '10. Contradictory Evidence');
        report.contradictoryEvidence.forEach(ce => {
          doc.font('Helvetica').fontSize(9).text(`- ${ce}`);
        });
        doc.moveDown();

        // 11. AI-Assisted Narrative
        if (report.aiNarrative) {
          this.renderSectionHeader(doc, '11. AI-Assisted Narrative');
          doc.font('Helvetica').fontSize(9).text(report.aiNarrative);
        } else {
          this.renderSectionHeader(doc, '11. AI-Assisted Narrative');
          doc.font('Helvetica').fontSize(9).text('AI narrative unavailable or not requested.');
        }

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).font('Helvetica').text(
            `Page ${i + 1} of ${pages.count} | CYBERTRACE Evidence-Backed Report`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a365d').text(title);
    doc.fillColor('black');
    doc.moveDown(0.5);
  }
}
export const pdfReportGenerator = new PdfReportGenerator();
