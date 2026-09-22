import { EntityType, RelationshipType, Severity } from '@prisma/client';

export interface GraphNodeData {
  id: string;
  type: EntityType;
  canonicalValue: string;
  displayValue: string | null;
  riskScore?: number;
  riskSeverity?: Severity;
  // Exclude raw evidence or sensitive paths
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: string;
  reason: string | null;
  evidenceReferences: string[];
}

export interface GraphNode {
  data: GraphNodeData;
}

export interface GraphEdge {
  data: GraphEdgeData;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TransactionPathNode extends GraphNodeData {
  isVictim?: boolean;
  isMule?: boolean;
  isCashOut?: boolean;
}
