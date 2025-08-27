/** @jest-environment node */

jest.mock('../../lib/rbacStore', () => ({
  readRbac: jest.fn(),
}));

import { listUsers } from '../rbac.server';
import { readRbac } from '../../lib/rbacStore';

describe('listUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns each user with their corresponding roles', async () => {
    (readRbac as jest.Mock).mockResolvedValue({
      users: {
        u1: { id: 'u1', name: 'User One', email: 'u1@example.com', password: 'hash1' },
        u2: { id: 'u2', name: 'User Two', email: 'u2@example.com', password: 'hash2' },
      },
      roles: {
        u1: ['admin'],
        u2: ['editor', 'viewer'],
      },
      permissions: {},
    });

    const users = await listUsers();

    expect(users).toEqual([
      {
        id: 'u1',
        name: 'User One',
        email: 'u1@example.com',
        password: 'hash1',
        roles: ['admin'],
      },
      {
        id: 'u2',
        name: 'User Two',
        email: 'u2@example.com',
        password: 'hash2',
        roles: ['editor', 'viewer'],
      },
    ]);

    expect(readRbac).toHaveBeenCalledTimes(1);
  });
});
