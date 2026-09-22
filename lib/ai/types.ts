export type QueryCategory = 
  | 'ENTITY'
  | 'RELATIONSHIP'
  | 'TRANSACTION'
  | 'RISK'
  | 'TIMELINE'
  | 'EVIDENCE'
  | 'CASE_SUMMARY'
  | 'GENERAL_INVESTIGATION';

export interface InvestigationQuery {
  text: string;
}

export interface InvestigationContext {
  caseInfo: unknown;
  entities: unknown[];
  relationships: unknown[];
  transactions: unknown[];
  riskAssessments: unknown[];
  findings: unknown[];
  timeline: unknown[];
  evidenceFiles: unknown[];
}

export interface AIResponse {
  answer: string;
  category: QueryCategory;
  references: string[];
}

export interface AIProvider {
  generateResponse(context: InvestigationContext, query: string, category: QueryCategory): Promise<AIResponse>;
}
