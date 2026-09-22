import fs from 'fs/promises';
import path from 'path';

export interface StorageOptions {
  caseId: string;
  evidenceId: string;
  fileExtension: string;
}

/**
 * Returns the configured root storage directory for evidence.
 * Ensure this directory is isolated from public paths.
 */
export const getStorageRoot = () => {
  return process.env.EVIDENCE_STORAGE_PATH || path.join(process.cwd(), '.storage', 'evidence');
};

/**
 * Generates a safe internal storage path for a file.
 */
export const generateStoragePath = (options: StorageOptions): string => {
  const { caseId, evidenceId, fileExtension } = options;

  // Ensure IDs do not contain path traversal characters
  if (!/^[a-zA-Z0-9\-_]+$/.test(caseId)) {
    throw new Error('Invalid case ID');
  }
  if (!/^[a-zA-Z0-9\-_]+$/.test(evidenceId)) {
    throw new Error('Invalid evidence ID');
  }

  // Safe file extension handling (strip anything that isn't a normal alphanumeric ext)
  const cleanExtension = fileExtension.replace(/[^a-zA-Z0-9]/g, '');
  const safeExtension = cleanExtension ? `.${cleanExtension}` : '';
  const filename = `${evidenceId}${safeExtension}`;
  
  return path.join(getStorageRoot(), caseId, filename);
};

/**
 * Stores the file buffer at the designated storage path.
 */
export const storeEvidence = async (fileBuffer: Buffer, storagePath: string): Promise<void> => {
  const directory = path.dirname(storagePath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(storagePath, fileBuffer);
};

/**
 * Retrieves the file buffer from the storage path.
 */
export const retrieveEvidence = async (storagePath: string): Promise<Buffer> => {
  return await fs.readFile(storagePath);
};
