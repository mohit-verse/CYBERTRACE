const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  try {
    await p.report.deleteMany();
    await p.riskFactor.deleteMany();
    await p.riskAssessment.deleteMany();
    await p.investigationFinding.deleteMany();
    await p.timelineEvent.deleteMany();
    await p.relationshipEvidence.deleteMany();
    await p.relationship.deleteMany();
    await p.transaction.deleteMany();
    await p.entity.deleteMany();
    await p.evidenceRecord.deleteMany();
    await p.evidenceFile.deleteMany();
    await p.case.deleteMany();
    console.log('Wipe OK');
  } catch(e){
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
run();
