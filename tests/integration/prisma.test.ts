/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PrismaClient } from '@prisma/client';

describe('Prisma Foundation', () => {
  it('should instantiate PrismaClient', () => {
    const prisma = new PrismaClient();
    expect(prisma).toBeDefined();
  });
});
