/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export interface NormalizationResult {
  canonical: unknown;
  original: unknown;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors: string[];
  warnings: string[];
}

export interface FieldNormalizer {
  normalize(value: unknown, context?: unknown): { canonicalValue?: string | number, originalValue: unknown, error?: string };
}
