import { jest } from '@jest/globals';

const editChanges: any[] = [];

class PrismaClient {
  editChange = {
    findMany: jest.fn(async () => [...editChanges]),
    count: jest.fn(async () => editChanges.length),
  };
}

export { PrismaClient, editChanges as __editChanges };
