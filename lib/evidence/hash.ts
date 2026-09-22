import crypto from 'crypto';

/**
 * Calculates the SHA-256 hash of a file buffer.
 */
export const calculateSha256 = async (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(buffer);
      resolve(hash.digest('hex'));
    } catch (err) {
      reject(err);
    }
  });
};
