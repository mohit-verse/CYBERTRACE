import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

async function seed() {
  try {
    const targetCase = await prisma.case.findFirst({ where: { caseNumber: 'CASE-2026-001' } });
    if (!targetCase) {
      console.log('Run reset-demo.ts first to create the case.');
      return;
    }
    
    console.log(`Seeding case: ${targetCase.id}`);
    const files = [
      { name: 'cdr.csv', type: 'CDR' },
      { name: 'ipdr.csv', type: 'IPDR' },
      { name: 'bank_transactions.csv', type: 'BANK_TRANSACTION' },
      { name: 'upi_transactions.csv', type: 'UPI_TRANSACTION' },
      { name: 'android_logs.json', type: 'ANDROID_LOG' },
      { name: 'email_headers.eml', type: 'EMAIL' },
    ];

    for (const f of files) {
      const p = path.join(process.cwd(), 'mock-data', 'case-001', f.name);
      
      const form = new FormData();
      form.append('artifactType', f.type);
      
      const blob = new Blob([fs.readFileSync(p)]);
      form.append('file', blob, f.name);

      console.log(`Uploading ${f.name}...`);
      const uploadRes = await fetch(`${API_BASE}/cases/${targetCase.id}/evidence`, {
        method: 'POST',
        body: form as any
      });
      const uploadJson = await uploadRes.json();
      
      if (uploadJson.success) {
        console.log(`Processing ${f.name}...`);
        await fetch(`${API_BASE}/cases/${targetCase.id}/evidence/${uploadJson.data.id}/process`, { method: 'POST' });
      } else {
        console.error(`Failed to upload ${f.name}:`, uploadJson);
      }
    }
    console.log('Seeding complete! Refresh your browser.');
  } finally {
    await prisma.$disconnect();
  }
}
seed();
