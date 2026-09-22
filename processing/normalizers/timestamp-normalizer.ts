/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';

export class TimestampNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    // Check if it's already a Date object
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return { originalValue: value, error: 'Invalid Date object' };
      }
      return { canonicalValue: value.toISOString(), originalValue: value };
    }

    const str = String(value).trim();
    const parsed = new Date(str);

    if (!isNaN(parsed.getTime())) {
      // The requirement says: do not invent a timezone. JS Date parse implicitly assumes local if missing Z.
      // For MVP, if it parses cleanly, we use it. If there is no timezone, JS defaults to local or UTC based on format.
      // We will store the ISO string which includes the resolved offset.
      return { canonicalValue: parsed.toISOString(), originalValue: value };
    }

    return { originalValue: value, error: 'Invalid timestamp format' };
  }
}
