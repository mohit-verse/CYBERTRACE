/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import prisma from '@/lib/db';
import { contextBuilder } from '@/lib/ai/context-builder';
import { getAIProvider, MockAIProvider } from '@/lib/ai/provider';
import { Severity, EntityType } from '@prisma/client';

describe('AI Investigation Layer', () => {
  let caseId: string;
  let case2Id: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const c = await prisma.case.create({ data: { caseNumber: `AI-${Date.now()}`, title: 'AI Test' } });
      caseId = c.id;
      
      const c2 = await prisma.case.create({ data: { caseNumber: `AI-2-${Date.now()}`, title: 'AI Test 2' } });
      case2Id = c2.id;
      
      dbAvailable = true;
    } catch (e) {
      console.warn('Database unavailable. Skipping DB tests.');
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId: { in: [caseId, case2Id] } } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.entity.deleteMany({ where: { caseId: { in: [caseId, case2Id] } } });
      await prisma.case.deleteMany({ where: { id: { in: [caseId, case2Id] } } });
    }
  });

  it('classifies queries correctly', () => {
    expect(contextBuilder.classifyQuery('why is this high risk')).toBe('RISK');
    expect(contextBuilder.classifyQuery('show transaction flow')).toBe('TRANSACTION');
    expect(contextBuilder.classifyQuery('what links these phones')).toBe('RELATIONSHIP');
    expect(contextBuilder.classifyQuery('what happened between 10am and 12pm')).toBe('TIMELINE');
    expect(contextBuilder.classifyQuery('summarize the findings')).toBe('CASE_SUMMARY');
    expect(contextBuilder.classifyQuery('random query without keywords')).toBe('GENERAL_INVESTIGATION');
  });

  it('builds context with strict case isolation', async () => {
    if (!dbAvailable) return;

    // Case 1
    const e1 = await prisma.entity.create({ data: { caseId, type: EntityType.PHONE, canonicalValue: '999' } });
    await prisma.riskAssessment.create({ data: { caseId, entityId: e1.id, score: 90, severity: Severity.CRITICAL }});

    // Case 2
    const e2 = await prisma.entity.create({ data: { caseId: case2Id, type: EntityType.BANK_ACCOUNT, canonicalValue: '888' } });
    await prisma.riskAssessment.create({ data: { caseId: case2Id, entityId: e2.id, score: 10, severity: Severity.LOW }});

    const ctx = await contextBuilder.buildContext(caseId, 'why is it high risk', 'RISK');
    
    expect(ctx.caseInfo).toBeDefined();
    expect((ctx.caseInfo as any).id).toBe(caseId);
    expect(ctx.entities.length).toBe(1);
    expect((ctx.entities[0] as any).id).toBe(e1.id);
    expect(ctx.riskAssessments.length).toBe(1);
    expect((ctx.riskAssessments[0] as any).entityId).toBe(e1.id);
  });

  it('mock provider generates response using context', async () => {
    if (!dbAvailable) return;

    const ctx = await contextBuilder.buildContext(caseId, 'why is it high risk', 'RISK');
    const provider = new MockAIProvider();
    
    const res = await provider.generateResponse(ctx, 'why is it high risk', 'RISK');
    expect(res.category).toBe('RISK');
    expect(res.answer).toContain('MOCK AI');
    expect(res.answer).toContain('Risk Score: 90');
    expect(res.references.length).toBeGreaterThan(0);
  });

  it('resolves the correct provider based on env', () => {
    const originalEnv = process.env.AI_PROVIDER;
    
    process.env.AI_PROVIDER = 'mock';
    const providerMock = getAIProvider();
    expect(providerMock).toBeInstanceOf(MockAIProvider);

    process.env.AI_PROVIDER = 'real';
    const providerReal = getAIProvider();
    expect(providerReal.constructor.name).toBe('RealAIProvider');
    
    process.env.AI_PROVIDER = originalEnv;
  });
});
