/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class AccountNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    // Preserve leading zeros, just strip whitespace and hyphens
    const str = String(value).trim();
    const cleaned = str.replace(/[\s-]/g, '');

    if (cleaned.length > 0) {
      return { canonicalValue: cleaned, originalValue: value };
    }

    return { originalValue: value, error: 'Malformed account identifier' };
  }
}
