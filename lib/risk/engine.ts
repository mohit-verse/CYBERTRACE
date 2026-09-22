/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { Severity } from '@prisma/client';
import { RISK_MODEL_VERSION, EvaluatedRiskFactor, RiskEvaluationResult } from './types';
import { riskEvaluators } from './evaluators';

export class RiskEngine {
  calculateSeverity(score: number): Severity {
    if (score <= 24) return Severity.LOW;
    if (score <= 49) return Severity.MEDIUM;
    if (score <= 74) return Severity.HIGH;
    return Severity.CRITICAL;
  }

  async calculateRiskForEntity(caseId: string, entityId: string): Promise<RiskEvaluationResult | null> {
    const entity = await prisma.entity.findUnique({ where: { id: entityId, caseId } });
    if (!entity) return null;

    const factors: EvaluatedRiskFactor[] = [];

    const multiHop = await riskEvaluators.evaluateMultiHop(caseId, entityId);
    if (multiHop) factors.push(multiHop);

    const sharedImei = await riskEvaluators.evaluateSharedImei(caseId, entityId, entity);
    if (sharedImei) factors.push(sharedImei);

    const sharedIp = await riskEvaluators.evaluateSharedIp(caseId, entityId, entity);
    if (sharedIp) factors.push(sharedIp);

    const sharedMac = await riskEvaluators.evaluateSharedMac(caseId, entityId, entity);
    if (sharedMac) factors.push(sharedMac);

    const recurringUpi = await riskEvaluators.evaluateRecurringUpi(caseId, entityId, entity);
    if (recurringUpi) factors.push(recurringUpi);

    // Sum weights, cap at 100
    let score = factors.reduce((acc, curr) => acc + curr.weight, 0);
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return { entityId, score, factors };
  }

  async runRiskCalculation(caseId: string): Promise<unknown> {
    const stats = { entitiesEvaluated: 0, assessmentsCreated: 0, factorsTriggered: 0 };
    
    const entities = await prisma.entity.findMany({ where: { caseId } });
    
    for (const entity of entities) {
      stats.entitiesEvaluated++;
      const result = await this.calculateRiskForEntity(caseId, entity.id);
      
      if (!result) continue;

      // Always recalculate from scratch and replace existing assessment for idempotent recalculation
      const existing = await prisma.riskAssessment.findFirst({
        where: { caseId, entityId: entity.id }
      });

      if (existing) {
        // Delete old factors first (cascade or manual)
        await prisma.riskFactor.deleteMany({ where: { riskAssessmentId: existing.id } });
        
        await prisma.riskAssessment.update({
          where: { id: existing.id },
          data: {
            score: result.score,
            severity: this.calculateSeverity(result.score),
            modelVersion: RISK_MODEL_VERSION,
            calculatedAt: new Date(),
            factors: {
              create: result.factors.map(f => ({
                factorType: f.factorType,
                weight: f.weight,
                description: f.description,
                evidenceReferences: f.evidenceReferences
              }))
            }
          }
        });
      } else {
        await prisma.riskAssessment.create({
          data: {
            caseId,
            entityId: entity.id,
            score: result.score,
            severity: this.calculateSeverity(result.score),
            modelVersion: RISK_MODEL_VERSION,
            factors: {
              create: result.factors.map(f => ({
                factorType: f.factorType,
                weight: f.weight,
                description: f.description,
                evidenceReferences: f.evidenceReferences
              }))
            }
          }
        });
      }

      stats.assessmentsCreated++;
      stats.factorsTriggered += result.factors.length;
    }

    return stats;
  }
}

export const riskEngine = new RiskEngine();
