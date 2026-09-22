/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';

const encodeSVG = (svgStr: string) => {
  const colored = svgStr.replace(/currentColor/g, '#ffffff');
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(colored);
};

const ICONS = {
  PHONE: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>'),
  DEVICE: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><rect width="6" height="6" x="9" y="9" rx="1" ry="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>'),
  BANK: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>'),
  UPI: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>'),
  NETWORK: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'),
  EMAIL: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'),
  DEFAULT: encodeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>')
};

// Dark-themed Cytoscape stylesheet
const stylesheet = [
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'background-color': '#3b82f6',
      'color': '#e2e8f0',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': '10px',
      'font-weight': 'bold',
      'width': 44,
      'height': 44,
      'shape': 'ellipse',
      'background-image': ICONS.DEFAULT,
      'background-width': '50%',
      'background-height': '50%',
      'text-wrap': 'wrap',
      'text-max-width': '90px',
      'text-margin-y': 8,
      'border-width': 3,
      'border-color': '#1e293b',
      'text-background-opacity': 0.85,
      'text-background-color': '#0a0e1a',
      'text-background-padding': '4px',
      'text-background-shape': 'roundrectangle',
      'overlay-padding': 6
    }
  },
  {
    selector: 'edge',
    style: {
      'label': 'data(label)',
      'width': 2,
      'line-color': '#334155',
      'target-arrow-color': '#475569',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'font-size': '8px',
      'color': '#94a3b8',
      'text-background-opacity': 0.9,
      'text-background-color': '#0a0e1a',
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'line-opacity': 0.8
    }
  },
  // Entity specific styles
  {
    selector: 'node[type="PHONE"]',
    style: { 'background-color': '#10b981', 'background-image': ICONS.PHONE }
  },
  {
    selector: 'node[type="IMEI"], node[type="IMSI"], node[type="DEVICE"]',
    style: { 'background-color': '#f59e0b', 'background-image': ICONS.DEVICE }
  },
  {
    selector: 'node[type="BANK_ACCOUNT"]',
    style: { 'background-color': '#8b5cf6', 'background-image': ICONS.BANK }
  },
  {
    selector: 'node[type="UPI"]',
    style: { 'background-color': '#ec4899', 'background-image': ICONS.UPI }
  },
  {
    selector: 'node[type="IP"], node[type="MAC"]',
    style: { 'background-color': '#f97316', 'background-image': ICONS.NETWORK }
  },
  {
    selector: 'node[type="EMAIL"]',
    style: { 'background-color': '#06b6d4', 'background-image': ICONS.EMAIL }
  },
  // Risk styling overrides
  {
    selector: 'node[riskSeverity="CRITICAL"]',
    style: { 'border-width': 4, 'border-color': '#ef4444', 'border-opacity': 1 }
  },
  {
    selector: 'node[riskSeverity="HIGH"]',
    style: { 'border-width': 3, 'border-color': '#f97316', 'border-opacity': 1 }
  },
  {
    selector: 'node:selected',
    style: { 'border-width': 4, 'border-color': '#3b82f6', 'border-style': 'dashed', 'overlay-color': '#3b82f6', 'overlay-opacity': 0.15 }
  },
  {
    selector: 'edge:selected',
    style: { 'width': 3, 'line-color': '#3b82f6', 'target-arrow-color': '#3b82f6', 'line-opacity': 1 }
  }
];

export default function InvestigationGraph({ caseId, transactionPathOnly = false }: { caseId: string, transactionPathOnly?: boolean }) {
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const endpoint = transactionPathOnly 
          ? `/api/cases/${caseId}/graph/transaction-path` 
          : `/api/cases/${caseId}/graph`;
          
        const res = await fetch(endpoint);
        const json = await res.json();
        
        if (!json.success) {
          throw new Error(json.error?.message || 'Failed to fetch graph data');
        }

        const nodes = json.data.nodes.map((n: any) => ({
          data: {
            id: n.data.id,
            label: n.data.displayValue || n.data.canonicalValue,
            type: n.data.type,
            riskScore: n.data.riskScore,
            riskSeverity: n.data.riskSeverity,
            canonicalValue: n.data.canonicalValue
          }
        }));

        const edges = json.data.edges.map((e: any) => ({
          data: {
            id: e.data.id,
            source: e.data.source,
            target: e.data.target,
            label: e.data.type,
            confidence: e.data.confidence,
            reason: e.data.reason,
            evidenceReferences: e.data.evidenceReferences
          }
        }));

        setElements([...nodes, ...edges]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [caseId, transactionPathOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Loading investigation graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-5 text-center">{error}</div>
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="text-slate-500 mb-2">No relationships to visualize</div>
          <div className="text-xs text-slate-600">Process evidence and run correlation to populate the graph.</div>
        </div>
      </div>
    );
  }

  const riskBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'badge-red';
      case 'HIGH': return 'badge-yellow';
      case 'MEDIUM': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Graph Canvas */}
      <div className="flex-grow relative bg-[#080c16]">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet as any}
          layout={{ name: 'cose', directed: true, padding: 50, nodeRepulsion: () => 8000, idealEdgeLength: () => 120 } as any}
          cy={(cy) => {
            cy.on('tap', 'node', (evt) => {
              setSelectedNode(evt.target.data());
              setSelectedEdge(null);
            });
            cy.on('tap', 'edge', (evt) => {
              setSelectedEdge(evt.target.data());
              setSelectedNode(null);
            });
            cy.on('tap', (evt) => {
              if (evt.target === cy) {
                setSelectedNode(null);
                setSelectedEdge(null);
              }
            });
          }}
        />
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-[#0a0e1a]/90 backdrop-blur-sm border border-[#2a2f45] rounded-lg p-3 text-xs">
          <div className="text-slate-400 font-semibold mb-2">Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" />Phone</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" />Device</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />Account</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />UPI</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500" style={{ transform: 'rotate(45deg)' }} />IP/MAC</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500" />Email</div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="w-full md:w-80 bg-[#111827] border-l border-[#2a2f45] p-5 overflow-y-auto">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Details
        </h3>

        {!selectedNode && !selectedEdge && (
          <div className="text-sm text-slate-500 bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
            Click a node or edge in the graph to view its details.
          </div>
        )}
        
        {selectedNode && (
          <div className="space-y-5">
            <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Entity Type</div>
              <span className="badge-blue">{selectedNode.type}</span>
            </div>
            <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Value</div>
              <div className="font-mono text-sm text-slate-200 break-all">{selectedNode.label}</div>
            </div>
            {selectedNode.riskScore !== undefined && (
              <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Risk Assessment</div>
                <div className="flex items-center gap-3">
                  <span className={riskBadgeClass(selectedNode.riskSeverity)}>{selectedNode.riskSeverity}</span>
                  <span className="font-mono text-lg font-bold text-slate-200">{selectedNode.riskScore}<span className="text-slate-500 text-sm">/100</span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedEdge && (
          <div className="space-y-5">
            <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Relationship</div>
              <span className="badge-purple">{selectedEdge.label}</span>
            </div>
            <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Confidence</div>
              <div className="font-mono text-lg font-bold text-slate-200">{selectedEdge.confidence}</div>
            </div>
            {selectedEdge.reason && (
              <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reason</div>
                <div className="text-sm text-slate-300 leading-relaxed">{selectedEdge.reason}</div>
              </div>
            )}
            {selectedEdge.evidenceReferences && selectedEdge.evidenceReferences.length > 0 && (
              <div className="bg-[#0f1225] rounded-lg p-4 border border-[#2a2f45]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Supporting Evidence</div>
                <ul className="space-y-1.5">
                  {selectedEdge.evidenceReferences.map((ref: string) => (
                    <li key={ref} className="text-xs text-cyan-400 font-mono break-all bg-[#0a0e1a] rounded px-2 py-1.5 border border-[#1a1f35]">{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
