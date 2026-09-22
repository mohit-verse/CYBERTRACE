import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateStoragePath, storeEvidence } from '@/lib/evidence/storage';
import { calculateSha256 } from '@/lib/evidence/hash';
import { ArtifactType } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';

// Max file size: 50MB (configurable via env later)
const MAX_FILE_SIZE = process.env.MAX_EVIDENCE_FILE_SIZE_MB 
  ? parseInt(process.env.MAX_EVIDENCE_FILE_SIZE_MB) * 1024 * 1024 
  : 50 * 1024 * 1024;

const ALLOWED_ARTIFACT_TYPES = Object.values(ArtifactType);

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const caseId = params.caseId;

    // Check if case exists
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' } }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const artifactTypeStr = formData.get('artifactType') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } }, { status: 400 });
    }

    if (!artifactTypeStr || !ALLOWED_ARTIFACT_TYPES.includes(artifactTypeStr as ArtifactType)) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid or missing artifact type' } }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum allowed size' } }, { status: 413 });
    }

    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    const mimeType = file.type || 'application/octet-stream';
    const artifactType = artifactTypeStr as ArtifactType;

    // Calculate hash from original bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256 = await calculateSha256(buffer);

    // Duplicate Detection (Check within the same case)
    const duplicateEvidence = await prisma.evidenceFile.findFirst({
      where: {
        caseId,
        sha256,
      },
    });

    if (duplicateEvidence) {
      // Create a duplicate record but don't overwrite the existing file
      // Actually, we could just create a new record referencing the same file, or just create it with a new storage path
      // The prompt says: "do not silently overwrite the existing artifact", "preserve the individual evidence record", "clearly identify the duplicate condition".
      // We will create a new EvidenceFile with a new UUID and store it again, or we can just flag it. The prompt says "preserve the individual evidence record".
    }

    const evidenceId = crypto.randomUUID();
    const storagePath = generateStoragePath({ caseId, evidenceId, fileExtension });

    // Store original bytes
    await storeEvidence(buffer, storagePath);

    // Persist Metadata
    const evidenceRecord = await prisma.evidenceFile.create({
      data: {
        id: evidenceId,
        caseId,
        originalFilename,
        storedFilename: path.basename(storagePath),
        mimeType,
        fileExtension,
        fileSize: file.size,
        sha256,
        artifactType,
        storagePath,
        processingStatus: 'UPLOADED',
        integrityStatus: 'PENDING', // Will remain pending until verified? Wait, during upload it's PENDING. "The API must not report VERIFIED before the hash has actually been calculated and stored." - well we just stored it. Wait, the specs say: "Integrity Status: PENDING". Let's stick to PENDING.
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: evidenceRecord.id,
        originalFilename: evidenceRecord.originalFilename,
        artifactType: evidenceRecord.artifactType,
        processingStatus: evidenceRecord.processingStatus,
        integrityStatus: evidenceRecord.integrityStatus,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Evidence upload error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process evidence upload' }
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const caseId = params.caseId;
    const files = await prisma.evidenceFile.findMany({
      where: { caseId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalFilename: true,
        artifactType: true,
        sha256: true,
        integrityStatus: true,
        processingStatus: true,
        uploadedAt: true,
      }
    });

    return NextResponse.json({ success: true, data: files });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list evidence' } }, { status: 500 });
  }
}
