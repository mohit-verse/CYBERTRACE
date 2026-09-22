const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const c3 = await p.entity.count();
  const c4 = await p.relationship.count();
  console.log({ entities: c3, rels: c4 });
  await p.$disconnect();
}
run();
