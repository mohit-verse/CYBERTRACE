import { CaseStatus, IntegrityStatus, ProcessingStatus, Severity, ArtifactType, EntityType, RelationshipType, Confidence } from '@prisma/client';

export interface ReportMetadata {
  reportId: string;
  caseId: string;
  version: string;
  generatedAt: string;
  generatedBy: string;
  status: string;
}

export interface ReportCaseSummary {
  caseNumber: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportEvidenceSummary {
  id: string;
  originalFilename: string;
  artifactType: ArtifactType;
  mimeType: string | null;
  fileExtension: string | null;
  fileSize: number | null;
  sha256: string | null;
  integrityStatus: IntegrityStatus;
  processingStatus: ProcessingStatus;
  uploadedAt: string;
  processedAt: string | null;
}

export interface ReportEntity {
  id: string;
  type: EntityType;
  canonicalValue: string;
  displayValue: string | null;
  riskScore: number;
  riskSeverity: Severity;
}

export interface ReportRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  confidence: Confidence;
  reason: string | null;
  evidenceReferences: string[];
}

export interface ReportTransaction {
  id: string;
  transactionReference: string | null;
  sourceAccountEntityId: string | null;
  destinationAccountEntityId: string | null;
  amount: number | null;
  currency: string | null;
  transactionTimestamp: string | null;
  channel: string | null;
  description: string | null;
}

export interface ReportRiskFactor {
  factorType: string;
  weight: number;
  description: string;
}

export interface ReportRiskAssessment {
  entityId: string;
  score: number;
  severity: Severity;
  calculatedAt: string;
  factors: ReportRiskFactor[];
}

export interface ReportFinding {
  id: string;
  findingType: string;
  severity: Severity;
  title: string;
  description: string | null;
  timestamp: string | null;
}

export interface ReportTimelineEvent {
  timestamp: string;
  eventType: string;
  title: string;
  description: string | null;
  primaryEntityId: string | null;
}

export interface StructuredReport {
  metadata: ReportMetadata;
  caseSummary: ReportCaseSummary;
  executiveSummary: {
    evidenceCount: number;
    entityCount: number;
    relationshipCount: number;
    transactionCount: number;
    findingsCount: number;
    criticalRiskCount: number;
    highRiskCount: number;
  };
  evidenceSummary: ReportEvidenceSummary[];
  entities: ReportEntity[];
  primeInvestigationEntities: {
    entity: ReportEntity;
    reason: string;
  }[];
  relationships: ReportRelationship[];
  transactionFlow: ReportTransaction[];
  communicationLinks: ReportRelationship[];
  deviceNetworkCorrelations: ReportRelationship[];
  riskAssessments: ReportRiskAssessment[];
  findings: ReportFinding[];
  investigationLeads: string[];
  timeline: ReportTimelineEvent[];
  dataQuality: string[];
  contradictoryEvidence: string[];
  aiNarrative?: string;
}
