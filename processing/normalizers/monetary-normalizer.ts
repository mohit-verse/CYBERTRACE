/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class MonetaryNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: number, originalValue: any, error?: string } {
    if (value === undefined || value === null || value === '') {
      return { originalValue: value, error: 'Missing value' };
    }
    
    // Check if it's already a number
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return { originalValue: value, error: 'Invalid numeric amount' };
      }
      return { canonicalValue: Math.round(value * 100) / 100, originalValue: value };
    }

    const str = String(value).trim();
    // Remove commas from strings like "1,234.56"
    const cleaned = str.replace(/,/g, '');
    const parsed = parseFloat(cleaned);

    if (!isNaN(parsed)) {
      return { canonicalValue: Math.round(parsed * 100) / 100, originalValue: value };
    }

    return { originalValue: value, error: 'Malformed monetary value' };
  }
}
