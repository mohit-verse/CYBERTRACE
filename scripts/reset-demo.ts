/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CYBERTRACE — Canonical Demo Reset
 * 
 * Resets the canonical CASE-2026-001 demo case to a clean state.
 * This script is strictly for development/demo environments.
 * 
 * Usage: npx ts-node scripts/reset-demo.ts
 * 
 * WARNING: This deletes ALL data associated with CASE-2026-001.
 * It does NOT delete other cases.
 */

import { PrismaClient } from '@prisma/client';

const CANONICAL_CASE_NUMBER = 'CASE-2026-001';

async function resetDemo() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   CYBERTRACE — Canonical Demo Reset      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();

  // Environment guard: refuse to run if NODE_ENV is production
  if (process.env.NODE_ENV === 'production') {
    console.error('✗ REFUSED: Cannot reset demo data in production environment.');
    console.error('  Set NODE_ENV to "development" or "test" to use this script.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✓ Database connected.');

    // Find existing canonical case
    const existing = await prisma.case.findFirst({
      where: { caseNumber: CANONICAL_CASE_NUMBER }
    });

    if (existing) {
      console.log(`  Found existing case: ${existing.id}`);
      console.log('  Clearing derived data...');

      const caseId = existing.id;

      // Delete in dependency order (most dependent first)
      await prisma.report.deleteMany({ where: { caseId } });
      console.log('  ✓ Reports cleared');

      await prisma.riskFactor.deleteMany({ where: { riskAssessment: { caseId } } });
      await prisma.riskAssessment.deleteMany({ where: { caseId } });
      console.log('  ✓ Risk assessments cleared');

      await prisma.investigationFinding.deleteMany({ where: { caseId } });
      console.log('  ✓ Findings cleared');

      await prisma.relationshipEvidence.deleteMany({ where: { relationship: { caseId } } });
      await prisma.relationship.deleteMany({ where: { caseId } });
      console.log('  ✓ Relationships cleared');

      await prisma.transaction.deleteMany({ where: { caseId } });
      console.log('  ✓ Transactions cleared');

      await prisma.entity.deleteMany({ where: { caseId } });
      console.log('  ✓ Entities cleared');

      await prisma.evidenceRecord.deleteMany({ where: { evidenceFile: { caseId } } });
      await prisma.evidenceFile.deleteMany({ where: { caseId } });
      console.log('  ✓ Evidence cleared');

      await prisma.case.delete({ where: { id: caseId } });
      console.log('  ✓ Case deleted');
    } else {
      console.log('  No existing canonical case found.');
    }

    // Create fresh canonical case
    const newCase = await prisma.case.create({
      data: {
        caseNumber: CANONICAL_CASE_NUMBER,
        title: 'UPI Fraud — Multi-Hop Mule Network',
        description: 'Canonical demonstration case. A victim is deceived into transferring money to a UPI-linked bank account. The received funds are rapidly transferred through multiple intermediary accounts. Additional telecom and device evidence reveals shared IMEI usage.',
        status: 'ACTIVE'
      }
    });

    console.log();
    console.log(`✓ Canonical case created: ${newCase.id}`);
    console.log(`  Case Number: ${newCase.caseNumber}`);
    console.log(`  Title: ${newCase.title}`);
    console.log();
    console.log('══════════════════════════════════════════');
    console.log('  DEMO RESET COMPLETE');
    console.log();
    console.log('  Next steps:');
    console.log('  1. Start the application: npm run dev');
    console.log('  2. Upload evidence from mock-data/case-001/');
    console.log('  3. Process each evidence file');
    console.log('  4. Or run: npx ts-node scripts/run-e2e.ts');
    console.log('══════════════════════════════════════════');

  } catch (err: any) {
    console.error();
    console.error('✗ Demo reset failed.');
    console.error(`  Error: ${err.message?.split('\n')[0] || 'Unknown'}`);
    console.error();
    console.error('  Ensure PostgreSQL is running and DATABASE_URL is set.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDemo();
