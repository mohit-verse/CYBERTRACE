/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class MacNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    const str = String(value).trim();
    // Strip all common separators
    const cleaned = str.replace(/[:-]/g, '').toUpperCase();
    
    if (cleaned.length === 12 && /^[0-9A-F]{12}$/.test(cleaned)) {
      // Re-insert colons
      const match = cleaned.match(/.{1,2}/g);
      if (match) {
        return { canonicalValue: match.join(':'), originalValue: value };
      }
    }

    return { originalValue: value, error: 'Invalid MAC address format' };
  }
}
