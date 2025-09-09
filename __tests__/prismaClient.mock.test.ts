/** @jest-environment node */

import { jest } from '@jest/globals';
import { PrismaClient, __editChanges } from '@prisma/client';

describe('PrismaClient manual mock', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    __editChanges.length = 0;
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it('findMany returns all edit changes', async () => {
    __editChanges.push({ id: 1 }, { id: 2 });
    await expect(prisma.editChange.findMany()).resolves.toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(prisma.editChange.findMany).toHaveBeenCalledTimes(1);
  });

  it('count returns number of edit changes', async () => {
    __editChanges.push({ id: 3 }, { id: 4 }, { id: 5 });
    await expect(prisma.editChange.count()).resolves.toBe(3);
    expect(prisma.editChange.count).toHaveBeenCalledTimes(1);
  });
});
