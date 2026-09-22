/* eslint-disable @typescript-eslint/no-explicit-any */
import { ingestionOrchestrator } from '@/lib/ingestion/orchestrator';
import { entityResolver } from '@/lib/entities/resolver';
import { correlationEngine } from '@/lib/correlation/engine';
import { riskEngine } from '@/lib/risk/engine';
import prisma from '@/lib/db';

export class InvestigationPipeline {
  /**
   * Executes the full deterministic pipeline for a given case.
   * If evidenceId is provided, it parses that specific file first.
   * Then it runs the case-wide derived state generations (Normalization, Entity Resolution, Correlation, Risk).
   */
  async runFullPipeline(caseId: string, evidenceId?: string) {
    try {
      console.log(`[CASE-${caseId}] Pipeline started`);
      
      // Stage 1 & 2: Evidence Integrity & Parsing
      if (evidenceId) {
        await ingestionOrchestrator.processEvidence(caseId, evidenceId);
        console.log(`[CASE-${caseId}] Evidence parsing complete (${evidenceId})`);
      } else {
        // Find all UPLOADED evidence and process them
        const unparsed = await prisma.evidenceFile.findMany({
          where: { caseId, processingStatus: 'UPLOADED' }
        });
        for (const ev of unparsed) {
          try {
            await ingestionOrchestrator.processEvidence(caseId, ev.id);
          } catch (e: any) {
            console.error(`[CASE-${caseId}] Evidence parsing failed for ${ev.id}: ${e.message}`);
          }
        }
        console.log(`[CASE-${caseId}] Bulk evidence parsing complete`);
      }

      // Stage 3 & 4: Normalization & Entity Resolution
      // The parser normalizes fields into normalizedData. 
      // entityResolver extracts those normalized fields into concrete Canonical Entities.
      await entityResolver.resolveCaseEntities(caseId);
      console.log(`[CASE-${caseId}] Entity resolution complete`);

      // Stage 5: Correlation
      await correlationEngine.runCorrelation(caseId);
      console.log(`[CASE-${caseId}] Correlation complete`);

      // Stage 6: Risk Calculation
      await riskEngine.runRiskCalculation(caseId);
      console.log(`[CASE-${caseId}] Risk calculation complete`);

      console.log(`[CASE-${caseId}] Pipeline ready`);
      return { success: true };
    } catch (error: any) {
      console.error(`[CASE-${caseId}] Pipeline failed:`, error.message);
      throw error;
    }
  }
}

export const investigationPipeline = new InvestigationPipeline();
