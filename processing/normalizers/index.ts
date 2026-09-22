/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PhoneNormalizer } from './phone-normalizer';
import { UpiNormalizer } from './upi-normalizer';
import { EmailNormalizer } from './email-normalizer';
import { IpNormalizer } from './ip-normalizer';
import { MacNormalizer } from './mac-normalizer';
import { TimestampNormalizer } from './timestamp-normalizer';
import { MonetaryNormalizer } from './monetary-normalizer';
import { AccountNormalizer } from './account-normalizer';

export const normalizers = {
  phone: new PhoneNormalizer(),
  upi: new UpiNormalizer(),
  email: new EmailNormalizer(),
  ip: new IpNormalizer(),
  mac: new MacNormalizer(),
  timestamp: new TimestampNormalizer(),
  monetary: new MonetaryNormalizer(),
  account: new AccountNormalizer()
};
