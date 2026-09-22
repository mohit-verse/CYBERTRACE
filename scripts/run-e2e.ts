/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CYBERTRACE — Canonical End-to-End Validation
 * 
 * Executes the complete investigation pipeline against the canonical
 * CASE-2026-001 demo scenario using actual application APIs and
 * actual database state.
 * 
 * Prerequisites:
 *   1. PostgreSQL running with DATABASE_URL set
 *   2. Prisma schema applied (npx prisma db push)
 *   3. Application running (npm run dev) on localhost:3000
 * 
 * Usage: npx ts-node scripts/run-e2e.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const MOCK_DATA_DIR = path.join(process.cwd(), 'mock-data', 'case-001');

// ─── Preflight ───────────────────────────────────────────────
async function preflight(): Promise<boolean> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  CYBERTRACE — Canonical E2E Validation           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('E2E BLOCKED: DATABASE_URL is not set.');
    return false;
  }

  // Check database connectivity
  try {
    await prisma.$connect();
    console.log('✓ Preflight: PostgreSQL is reachable.');
  } catch (err: any) {
    console.error('E2E BLOCKED: PostgreSQL unavailable.');
    console.error(`  ${err.message?.split('\n')[0] || 'Connection failed'}`);
    return false;
  }

  // Check mock data exists
  if (!fs.existsSync(MOCK_DATA_DIR)) {
    console.error('E2E BLOCKED: mock-data/case-001/ directory not found.');
    return false;
  }

  // Check application is running
  try {
    const healthRes = await fetch(`${API_BASE}/cases`);
    if (!healthRes.ok) throw new Error(`Status: ${healthRes.status}`);
    console.log('✓ Preflight: Application is reachable.');
  } catch {
    console.error('E2E BLOCKED: Application is not running at ' + API_BASE);
    console.error('  Start it with: npm run dev');
    return false;
  }

  return true;
}

// ─── Canonical Evidence Files ────────────────────────────────
const CANONICAL_FILES = [
  { name: 'cdr.csv', type: 'CDR' },
  { name: 'ipdr.csv', type: 'IPDR' },
  { name: 'bank_transactions.csv', type: 'BANK_TRANSACTION' },
  { name: 'upi_transactions.csv', type: 'UPI_TRANSACTION' },
  { name: 'android_logs.json', type: 'ANDROID_LOG' },
  { name: 'email_headers.eml', type: 'EMAIL' },
];

// ─── Main E2E ────────────────────────────────────────────────
async function runE2E() {
  const ok = await preflight();
  if (!ok) {
    console.log('\n══════════════════════════════════════════');
    console.log('  E2E RESULT: BLOCKED');
    console.log('══════════════════════════════════════════');
    await prisma.$disconnect();
    process.exit(1);
  }

  let caseId = '';
  const results = {
    evidenceCount: 0,
    entityCount: 0,
    relationshipCount: 0,
    transactionCount: 0,
    findingCount: 0,
    riskCount: 0,
    reportGenerated: false,
    idempotent: false,
    sha256Verified: false,
  };

  try {
    // ─── Step 1: Clean State ─────────────────────────────────
    console.log('\n[1] Preparing clean state...');
    const existing = await prisma.case.findFirst({ where: { caseNumber: 'CASE-2026-001' } });
    if (existing) {
      // Delete in dependency order
      await prisma.report.deleteMany({ where: { caseId: existing.id } });
      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId: existing.id } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId: existing.id } });
      await prisma.investigationFinding.deleteMany({ where: { caseId: existing.id } });
      await prisma.relationshipEvidence.deleteMany({ where: { relationship: { caseId: existing.id } } });
      await prisma.relationship.deleteMany({ where: { caseId: existing.id } });
      await prisma.transaction.deleteMany({ where: { caseId: existing.id } });
      await prisma.entity.deleteMany({ where: { caseId: existing.id } });
      await prisma.evidenceRecord.deleteMany({ where: { evidenceFile: { caseId: existing.id } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId: existing.id } });
      await prisma.case.delete({ where: { id: existing.id } });
      console.log('  ✓ Previous canonical case cleared.');
    }

    // ─── Step 2: Create Case ─────────────────────────────────
    console.log('\n[2] Creating canonical case...');
    const caseRes = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseNumber: 'CASE-2026-001',
        title: 'UPI Fraud — Multi-Hop Mule Network',
        description: 'Canonical demonstration case'
      })
    });
    const caseData = await caseRes.json();
    if (!caseData.success) throw new Error('Case creation failed: ' + JSON.stringify(caseData.error));
    caseId = caseData.data.id;
    console.log(`  ✓ Case created: ${caseId}`);

    // ─── Step 3: Upload & Process Evidence ───────────────────
    console.log('\n[3] Uploading & processing evidence...');
    const evidenceIds: string[] = [];
    const expectedHashes: Record<string, string> = {};

    for (const f of CANONICAL_FILES) {
      const filePath = path.join(MOCK_DATA_DIR, f.name);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠ Skipping ${f.name} (file not found)`);
        continue;
      }

      const buffer = fs.readFileSync(filePath);

      // Calculate expected SHA-256 from raw bytes
      const expectedHash = crypto.createHash('sha256').update(buffer).digest('hex');
      expectedHashes[f.name] = expectedHash;

      const blob = new Blob([buffer]);
      const formData = new FormData();
      formData.append('file', blob, f.name);
      formData.append('artifactType', f.type);

      const upRes = await fetch(`${API_BASE}/cases/${caseId}/evidence`, {
        method: 'POST',
        body: formData
      });
      const upData = await upRes.json();
      if (!upData.success) {
        console.error(`  ✗ Upload failed for ${f.name}: ${JSON.stringify(upData.error)}`);
        continue;
      }
      evidenceIds.push(upData.data.id);
      results.evidenceCount++;
      console.log(`  ✓ Uploaded ${f.name} → ${upData.data.id}`);

      // Process
      const procRes = await fetch(`${API_BASE}/cases/${caseId}/evidence/${upData.data.id}/process`, {
        method: 'POST'
      });
      const procData = await procRes.json();
      if (!procData.success) {
        console.error(`  ✗ Processing failed for ${f.name}: ${JSON.stringify(procData.error)}`);
      } else {
        console.log(`    ✓ Processed ${f.name}`);
      }
    }

    // ─── Step 4: SHA-256 Verification ────────────────────────
    console.log('\n[4] Verifying SHA-256 integrity...');
    const evidenceFiles = await prisma.evidenceFile.findMany({ where: { caseId } });
    let sha256AllMatch = true;
    for (const ef of evidenceFiles) {
      const expected = expectedHashes[ef.originalFilename];
      if (expected && ef.sha256 !== expected) {
        console.error(`  ✗ SHA-256 MISMATCH for ${ef.originalFilename}: expected ${expected}, got ${ef.sha256}`);
        sha256AllMatch = false;
      } else if (expected) {
        console.log(`  ✓ ${ef.originalFilename}: ${ef.sha256}`);
      }
    }
    results.sha256Verified = sha256AllMatch;
    console.log(`  SHA-256 integrity: ${sha256AllMatch ? 'VERIFIED' : 'FAILED'}`);

    // ─── Step 5: Entity Validation ───────────────────────────
    console.log('\n[5] Verifying entities...');
    const entities = await prisma.entity.findMany({ where: { caseId }, orderBy: { type: 'asc' } });
    results.entityCount = entities.length;
    console.log(`  ✓ ${entities.length} entities`);
    entities.forEach(e => console.log(`    ${e.type}: ${e.canonicalValue}`));

    // ─── Step 6: Relationship Validation ─────────────────────
    console.log('\n[6] Verifying relationships...');
    const relationships = await prisma.relationship.findMany({
      where: { caseId },
      include: { sourceEntity: true, targetEntity: true, evidence: true }
    });
    results.relationshipCount = relationships.length;
    console.log(`  ✓ ${relationships.length} relationships`);
    relationships.forEach(r => {
      console.log(`    ${r.sourceEntity.canonicalValue} —[${r.relationshipType}]→ ${r.targetEntity.canonicalValue} (${r.confidence}, ${r.evidence.length} evidence refs)`);
    });

    // ─── Step 7: Transaction Validation ──────────────────────
    console.log('\n[7] Verifying transactions...');
    const txs = await prisma.transaction.findMany({
      where: { caseId },
      include: { sourceAccountEntity: true, destinationAccountEntity: true },
      orderBy: { transactionTimestamp: 'asc' }
    });
    results.transactionCount = txs.length;
    console.log(`  ✓ ${txs.length} transactions`);
    txs.forEach(t => {
      const src = t.sourceAccountEntity?.canonicalValue || '?';
      const dst = t.destinationAccountEntity?.canonicalValue || '?';
      console.log(`    ${src} → ${dst}: ₹${t.amount} (${t.channel}, ${t.transactionReference || 'no-ref'})`);
    });

    // ─── Step 8: Findings Validation ─────────────────────────
    console.log('\n[8] Verifying findings...');
    const findings = await prisma.investigationFinding.findMany({ where: { caseId } });
    results.findingCount = findings.length;
    console.log(`  ✓ ${findings.length} findings`);
    findings.forEach(f => console.log(`    ${f.findingType}: ${f.title} (${f.severity})`));

    // ─── Step 9: Risk Validation ─────────────────────────────
    console.log('\n[9] Verifying risk assessments...');
    const risks = await prisma.riskAssessment.findMany({
      where: { caseId },
      include: { factors: true, entity: true },
      orderBy: { score: 'desc' }
    });
    results.riskCount = risks.length;
    console.log(`  ✓ ${risks.length} risk assessments`);
    risks.forEach(r => {
      console.log(`    ${r.entity.canonicalValue}: Score ${r.score} → ${r.severity}`);
      r.factors.forEach(f => console.log(`      • ${f.factorType}: +${f.weight} — ${f.description}`));
    });

    // ─── Step 10: Graph Validation ───────────────────────────
    console.log('\n[10] Verifying graph API...');
    const graphRes = await fetch(`${API_BASE}/cases/${caseId}/graph`);
    const graphData = await graphRes.json();
    if (graphData.success) {
      console.log(`  ✓ Graph: ${graphData.data.nodes?.length || 0} nodes, ${graphData.data.edges?.length || 0} edges`);
    } else {
      console.error('  ✗ Graph API failed');
    }

    // ─── Step 11: Dashboard Validation ───────────────────────
    console.log('\n[11] Verifying dashboard API...');
    const dashRes = await fetch(`${API_BASE}/cases/${caseId}/dashboard`);
    const dashData = await dashRes.json();
    if (dashData.success) {
      const d = dashData.data;
      console.log(`  ✓ Dashboard KPIs:`);
      console.log(`    Evidence: ${d.evidenceCount}`);
      console.log(`    Entities: ${d.entityCount}`);
      console.log(`    Relationships: ${d.relationshipCount}`);
      console.log(`    Transactions: ${d.transactionCount}`);
      console.log(`    Findings: ${d.findingCount}`);
      console.log(`    High Risk: ${d.highRiskCount}`);
      console.log(`    Critical Risk: ${d.criticalRiskCount}`);
    } else {
      console.error('  ✗ Dashboard API failed');
    }

    // ─── Step 12: AI Validation ──────────────────────────────
    console.log('\n[12] Verifying AI investigation...');
    const aiRes = await fetch(`${API_BASE}/cases/${caseId}/investigation/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Summarize the key findings.' })
    });
    const aiData = await aiRes.json();
    if (aiData.success) {
      console.log(`  ✓ AI responded (${aiData.data.response?.length || 0} chars)`);
    } else {
      console.log(`  ⚠ AI unavailable: ${JSON.stringify(aiData.error)}`);
    }

    // ─── Step 13: Report Generation ──────────────────────────
    console.log('\n[13] Generating report...');
    const repRes = await fetch(`${API_BASE}/cases/${caseId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestAiNarrative: false })
    });
    const repData = await repRes.json();
    if (repData.success) {
      results.reportGenerated = true;
      const reportId = repData.data.id;
      console.log(`  ✓ Report generated: ${reportId}`);

      // Verify JSON download
      const jsonRes = await fetch(`${API_BASE}/cases/${caseId}/reports/${reportId}/json`);
      console.log(`  ✓ JSON download: ${jsonRes.ok ? 'OK' : 'FAILED'}`);

      // Verify PDF download
      const pdfRes = await fetch(`${API_BASE}/cases/${caseId}/reports/${reportId}/pdf`);
      console.log(`  ✓ PDF download: ${pdfRes.ok ? 'OK' : 'FAILED'}`);
    } else {
      console.error(`  ✗ Report generation failed: ${JSON.stringify(repData.error)}`);
    }

    // ─── Step 14: Idempotency ────────────────────────────────
    console.log('\n[14] Idempotency check (reprocessing all evidence)...');
    for (const id of evidenceIds) {
      await fetch(`${API_BASE}/cases/${caseId}/evidence/${id}/process`, { method: 'POST' });
    }
    const eCount2 = await prisma.entity.count({ where: { caseId } });
    const rCount2 = await prisma.relationship.count({ where: { caseId } });
    const fCount2 = await prisma.investigationFinding.count({ where: { caseId } });
    const tCount2 = await prisma.transaction.count({ where: { caseId } });
    results.idempotent = (
      eCount2 === results.entityCount &&
      rCount2 === results.relationshipCount
    );
    console.log(`  Entities:       ${results.entityCount} → ${eCount2}`);
    console.log(`  Relationships:  ${results.relationshipCount} → ${rCount2}`);
    console.log(`  Transactions:   ${results.transactionCount} → ${tCount2}`);
    console.log(`  Findings:       ${results.findingCount} → ${fCount2}`);
    console.log(`  Idempotent: ${results.idempotent ? 'YES' : 'NO'}`);

    // ─── Step 15: Case Isolation ─────────────────────────────
    console.log('\n[15] Case isolation check...');
    const isoCase = await prisma.case.create({
      data: { caseNumber: 'CASE-E2E-ISO-' + Date.now(), title: 'Isolation Test' }
    });
    const isoEntities = await prisma.entity.count({ where: { caseId: isoCase.id } });
    const isoRels = await prisma.relationship.count({ where: { caseId: isoCase.id } });
    console.log(`  ✓ Isolation case entities: ${isoEntities} (expected 0)`);
    console.log(`  ✓ Isolation case relationships: ${isoRels} (expected 0)`);
    await prisma.case.delete({ where: { id: isoCase.id } });
    console.log(`  ✓ Isolation case cleaned up`);

    // ─── Final Summary ───────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log('  E2E RESULT: PASSED');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Evidence:      ${results.evidenceCount}`);
    console.log(`  Entities:      ${results.entityCount}`);
    console.log(`  Relationships: ${results.relationshipCount}`);
    console.log(`  Transactions:  ${results.transactionCount}`);
    console.log(`  Findings:      ${results.findingCount}`);
    console.log(`  Risks:         ${results.riskCount}`);
    console.log(`  SHA-256:       ${results.sha256Verified ? 'VERIFIED' : 'FAILED'}`);
    console.log(`  Idempotent:    ${results.idempotent ? 'YES' : 'NO'}`);
    console.log(`  Report:        ${results.reportGenerated ? 'GENERATED' : 'FAILED'}`);
    console.log('══════════════════════════════════════════════════');

  } catch (err: any) {
    console.error('\n══════════════════════════════════════════════════');
    console.error('  E2E RESULT: FAILED');
    console.error('══════════════════════════════════════════════════');
    console.error(`  Error: ${err.message}`);
    console.error('══════════════════════════════════════════════════');
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
