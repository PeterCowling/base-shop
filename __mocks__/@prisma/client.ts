import { jest } from '@jest/globals';

const editChanges: any[] = [];

class PrismaClient {
  editChange = {
    findMany: jest.fn(async () => [...editChanges]),
    count: jest.fn(async () => editChanges.length),
  };

  inventoryHold = {
    findMany: jest.fn(async () => []),
    update: jest.fn(async (args: any) => args.data),
    delete: jest.fn(async () => ({})),
  };

  inventoryItem = {
    findMany: jest.fn(async () => []),
    update: jest.fn(async (args: any) => args.data),
  };
}

export { PrismaClient, editChanges as __editChanges };
