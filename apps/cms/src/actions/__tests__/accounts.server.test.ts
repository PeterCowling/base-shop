/** @jest-environment node */

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

import { approveAccount, requestAccount, listPendingUsers } from '../accounts.server';
import { readRbac, writeRbac } from '../../lib/server/rbacStore';
import { sendEmail } from '@acme/email';

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

