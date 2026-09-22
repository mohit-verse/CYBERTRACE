/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { FieldNormalizer } from './types';
import * as net from 'net';

export class IpNormalizer implements FieldNormalizer {
  normalize(value: any): { canonicalValue?: string, originalValue: any, error?: string } {
    if (!value) return { originalValue: value, error: 'Missing value' };
    
    const str = String(value).trim();
    
    // Very basic IP validation using Node's net module
    if (net.isIP(str) !== 0) {
      // In IPv6, casing can differ, so we can lower it. IPv4 is just numbers and dots.
      return { canonicalValue: str.toLowerCase(), originalValue: value };
    }

    return { originalValue: value, error: 'Invalid IP address format' };
  }
}
