/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { EntityType, RelationshipType, Confidence, Severity } from '@prisma/client';

export interface CandidateRelationship {
  sourceEntityType: EntityType;
  sourceCanonicalValue: string;
  targetEntityType: EntityType;
  targetCanonicalValue: string;
  relationshipType: RelationshipType;
  confidence: Confidence;
  reason: string;
  evidenceRecordId: string;
  ruleId: string;
  timestamp?: Date;
}

export interface CorrelationRule {
  id: string;
  evaluate(record: any): CandidateRelationship[];
}

export interface FindingCandidate {
  findingType: string;
  severity: Severity;
  title: string;
  description: string;
  caseId: string;
  entities: string[]; // Entity IDs involved
}
