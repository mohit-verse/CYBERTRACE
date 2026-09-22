const { PrismaClient } = require('@prisma/client');
const { investigationPipeline } = require('./.next/server/app/api/cases/[caseId]/evidence/[evidenceId]/process/route');
// wait, I can't easily require Next.js compiled files from root.

// Instead, I can just make an HTTP call to the app to re-process all evidence.
const run = async () => {
  const p = new PrismaClient();
  const c = await p.case.findFirst({ where: { caseNumber: 'CASE-2026-001' } });
  const files = await p.evidenceFile.findMany({ where: { caseId: c.id } });
  
  for (const f of files) {
    console.log('Re-processing', f.originalFilename);
    await fetch(`http://localhost:3000/api/cases/${c.id}/evidence/${f.id}/process`, { method: 'POST' });
  }
  
  const entities = await p.entity.count({ where: { caseId: c.id } });
  const rels = await p.relationship.count({ where: { caseId: c.id } });
  console.log(`Entities: ${entities}, Relationships: ${rels}`);
  await p.$disconnect();
};
run();
