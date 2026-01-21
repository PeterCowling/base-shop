/** @jest-environment node */

import argon2 from 'argon2';

import { sendEmail } from '@acme/email';

import { readRbac, writeRbac } from '../../lib/server/rbacStore';
import { approveAccount, listPendingUsers,requestAccount } from '../accounts.server';

jest.mock('../../lib/server/rbacStore', () => ({
  readRbac: jest.fn(),
  writeRbac: jest.fn(),
}));

jest.mock('@acme/email', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('requestAccount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('hashes password and returns pending entry', async () => {
    const form = new FormData();
    form.set('name', 'Alice');
    form.set('email', 'alice@example.com');
    form.set('password', 'secret');

    await requestAccount(form);

    expect(argon2.hash).toHaveBeenCalledWith('secret');
    const pending = await listPendingUsers();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
    });

    // cleanup so subsequent tests are isolated
    const cleanupForm = new FormData();
    cleanupForm.set('id', pending[0].id);
    cleanupForm.append('roles', 'viewer');
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });
    await approveAccount(cleanupForm);
  });
});

describe('approveAccount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws error when id does not exist in PENDING_USERS', async () => {
    const form = new FormData();
    form.set('id', 'missing');
    form.append('roles', 'viewer');

    await expect(approveAccount(form)).rejects.toThrow('pending user not found');
    expect(readRbac).not.toHaveBeenCalled();
    expect(writeRbac).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('persists user, sends email and removes from pending', async () => {
    const requestForm = new FormData();
    requestForm.set('name', 'Alice');
    requestForm.set('email', 'alice@example.com');
    requestForm.set('password', 'secret');
    await requestAccount(requestForm);

    const [pending] = await listPendingUsers();
    const approveForm = new FormData();
    approveForm.set('id', pending.id);
    approveForm.append('roles', 'viewer');

    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    await approveAccount(approveForm);

    expect(writeRbac).toHaveBeenCalledWith(
      expect.objectContaining({
        users: {
          [pending.id]: {
            id: pending.id,
            name: 'Alice',
            email: 'alice@example.com',
          },
        },
        roles: { [pending.id]: 'viewer' },
      })
    );

    expect(sendEmail).toHaveBeenCalledWith(
      'alice@example.com',
      'Account approved',
      'Your account has been approved'
    );

    expect(await listPendingUsers()).toHaveLength(0);
  });

  it.each([
    { roles: ['admin'], expected: 'admin' },
    { roles: ['editor', 'viewer'], expected: ['editor', 'viewer'] },
  ])('role array length %#', async ({ roles, expected }) => {
    const requestForm = new FormData();
    requestForm.set('name', 'Alice');
    requestForm.set('email', 'alice@example.com');
    requestForm.set('password', 'secret');
    await requestAccount(requestForm);

    const [pending] = await listPendingUsers();
    const approveForm = new FormData();
    approveForm.set('id', pending.id);
    roles.forEach((r) => approveForm.append('roles', r));

    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    await approveAccount(approveForm);

    expect(writeRbac).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: { [pending.id]: expected },
      })
    );
  });
});

