/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CYBERTRACE — Database Preflight Check
 * 
 * Verifies that PostgreSQL is reachable and the Prisma schema is applied
 * before attempting any database-dependent operations.
 * 
 * Usage: npx ts-node scripts/preflight.ts
 */

import { PrismaClient } from '@prisma/client';

async function preflight(): Promise<boolean> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   CYBERTRACE — Database Preflight Check  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();

  // 1. Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('✗ DATABASE_URL is not set.');
    console.error('  Set DATABASE_URL in .env and ensure PostgreSQL is running.');
    return false;
  }
  // Mask the URL for safe logging
  const masked = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`✓ DATABASE_URL is configured (${masked.substring(0, 40)}...)`);

  // 2. Initialize Prisma
  const prisma = new PrismaClient();
  try {
    // 3. Attempt connection
    await prisma.$connect();
    console.log('✓ PostgreSQL is reachable.');

    // 4. Verify schema exists by querying a known model
    const caseCount = await prisma.case.count();
    console.log(`✓ Schema is applied. Current cases: ${caseCount}`);

    // 5. Verify Prisma client is functional
    const result = await prisma.$queryRaw`SELECT 1 as check_value`;
    console.log('✓ Prisma client is functional.');

    console.log();
    console.log('══════════════════════════════════════════');
    console.log('  PREFLIGHT PASSED — Database is ready.');
    console.log('══════════════════════════════════════════');
    return true;
  } catch (err: any) {
    console.error();
    console.error('✗ CYBERTRACE database preflight failed.');
    console.error();
    console.error('  PostgreSQL is unavailable or schema is not applied.');
    console.error();
    console.error('  Required actions:');
    console.error('  1. Install and start PostgreSQL');
    console.error('  2. Create the cybertrace database');
    console.error('  3. Set DATABASE_URL in .env');
    console.error('  4. Run: npx prisma db push');
    console.error('  5. Run: npx prisma generate');
    console.error();
    console.error(`  Error: ${err.message?.split('\n')[0] || 'Unknown'}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

preflight().then(ok => {
  process.exit(ok ? 0 : 1);
});
