/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AIProvider, AIResponse, InvestigationContext, QueryCategory } from './types';
import { buildSystemPrompt, buildContextPrompt } from './prompts';

export class MockAIProvider implements AIProvider {
  async generateResponse(context: InvestigationContext, query: string, category: QueryCategory): Promise<AIResponse> {
    let answer = `[MOCK AI] This is a mock response because AI_PROVIDER=mock.\n\n`;
    const refs: string[] = [];
    
    if (category === 'RISK' && context.riskAssessments.length > 0) {
      const topRisk = (context.riskAssessments as any)[0];
      answer += `Risk Score: ${topRisk.score}\nSeverity: ${topRisk.severity}\n\nContributing factors:\n`;
      topRisk.factors?.forEach((f: any) => {
        answer += `- ${f.factorType} (+${f.weight})\n`;
      });
      refs.push(topRisk.entityId);
    } else if (category === 'TRANSACTION') {
      answer += `Transaction flow analysis based on available context:\n`;
      const txs = context.transactions as any[];
      if (txs.length > 0) {
        answer += `Found ${txs.length} transactions in context.\n`;
        refs.push(txs[0].id);
      } else {
        answer += `No transactions found in the supplied investigation context.\n`;
      }
    } else if (category === 'RELATIONSHIP') {
      answer += `Relationship analysis:\n`;
      const rels = context.relationships as any[];
      if (rels.length > 0) {
        answer += `Found ${rels.length} relationships in context.\n`;
        refs.push(rels[0].id);
      } else {
        answer += `No relationships found in the supplied investigation context.\n`;
      }
    } else {
      answer += `General investigation summary. I have received ${context.entities.length} entities and ${context.findings.length} findings.`;
    }

    return {
      answer,
      category,
      references: refs
    };
  }
}

export class SarvamAIProvider implements AIProvider {
  async generateResponse(context: InvestigationContext, query: string, category: QueryCategory): Promise<AIResponse> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('Sarvam AI credentials missing in environment variables');
    }

    const systemPrompt = buildSystemPrompt();
    const contextPrompt = buildContextPrompt(context);
    
    // We append the context to the user query so the AI has the data
    const fullUserMessage = `${contextPrompt}\n\nUser Query: ${query}`;

    try {
      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey
        },
        body: JSON.stringify({
          model: 'sarvam-105b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullUserMessage }
          ],
          temperature: 0.1,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sarvam API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      console.log('SARVAM RAW RESPONSE:', JSON.stringify(data, null, 2));
      const answer = data.choices[0]?.message?.content || "The AI was unable to generate a response for this query.";

      // Basic heuristic to pull out UUIDs as references
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const refs = Array.from(new Set(answer.match(uuidRegex) || [])) as string[];

      return {
        answer,
        category,
        references: refs
      };
    } catch (error) {
      console.error('Sarvam AI Request failed:', error);
      throw error;
    }
  }
}

export class RealAIProvider implements AIProvider {
  async generateResponse(context: InvestigationContext, query: string, category: QueryCategory): Promise<AIResponse> {
    throw new Error('Real AI provider not fully implemented. Please use Sarvam or Mock.');
  }
}

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || 'mock';
  if (providerType.toLowerCase() === 'sarvam') {
    return new SarvamAIProvider();
  }
  if (providerType === 'mock') {
    return new MockAIProvider();
  }
  return new RealAIProvider();
}
