/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphData, GraphNode, GraphEdge } from './types';

export function buildGraph(entities: any[], relationships: any[], riskAssessments: any[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const riskMap = new Map<string, any>();
  for (const r of riskAssessments) {
    riskMap.set(r.entityId, r);
  }

  for (const e of entities) {
    const risk = riskMap.get(e.id);
    nodes.push({
      data: {
        id: e.id,
        type: e.type,
        canonicalValue: e.canonicalValue,
        displayValue: e.displayValue,
        riskScore: risk?.score,
        riskSeverity: risk?.severity
      }
    });
  }

  for (const r of relationships) {
    // Only map edges where both nodes exist
    if (entities.find(e => e.id === r.sourceEntityId) && entities.find(e => e.id === r.targetEntityId)) {
      edges.push({
        data: {
          id: r.id,
          source: r.sourceEntityId,
          target: r.targetEntityId,
          type: r.relationshipType,
          confidence: r.confidence,
          reason: r.reason,
          evidenceReferences: r.evidence?.map((ev: any) => ev.evidenceRecordId) || []
        }
      });
    }
  }

  return { nodes, edges };
}
