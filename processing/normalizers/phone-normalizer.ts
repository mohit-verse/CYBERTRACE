/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class PhoneNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    const str = String(value);
    // Remove all non-numeric characters (except leading + which we will handle)
    let cleaned = str.replace(/[^\d+]/g, '');

    // Canonical rules for MVP:
    // If it's an Indian number (+91 or 91 followed by 10 digits), canonicalize to 10 digits.
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // 0 followed by 10 digits
      cleaned = cleaned.substring(1);
    }

    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return { canonicalValue: cleaned, originalValue: value };
    }

    // For non-Indian or generic numbers, we just strip non-digits. 
    // If it's completely malformed (no digits), fail.
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      return { canonicalValue: digitsOnly, originalValue: value };
    }

    return { originalValue: value, error: 'Invalid phone format' };
  }
}
