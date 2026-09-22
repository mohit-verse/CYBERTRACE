/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class EmailNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    const str = String(value).trim();
    if (!str.includes('@')) {
      return { originalValue: value, error: 'Malformed email address' };
    }

    const canonical = str.toLowerCase();
    
    return { canonicalValue: canonical, originalValue: value };
  }
}
