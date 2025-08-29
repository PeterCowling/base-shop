/** @jest-environment node */

jest.mock('../lib/server/rbacStore', () => ({
  readRbac: jest.fn(),
  writeRbac: jest.fn(),
}));

jest.mock('argon2', () => ({ hash: jest.fn() }));
jest.mock('ulid', () => ({ ulid: jest.fn() }));

import { updateUserRoles, inviteUser, updateRolePermissions } from '../actions/rbac.server';
import { readRbac, writeRbac } from '../lib/server/rbacStore';
import argon2 from 'argon2';
import { ulid } from 'ulid';

describe('updateUserRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when user id not found', async () => {
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    const form = new FormData();
    form.set('id', 'missing');
    form.append('roles', 'admin');

    await expect(updateUserRoles(form)).rejects.toThrow('user not found');
    expect(writeRbac).not.toHaveBeenCalled();
  });

  it('stores single role as string and multiple roles as array', async () => {
    const db = {
      users: { u1: { id: 'u1', name: 'User', email: 'u1@example.com', password: 'hash' } },
      roles: {},
      permissions: {},
    };
    (readRbac as jest.Mock).mockResolvedValue({
      users: { ...db.users },
      roles: {},
      permissions: {},
    });

    const single = new FormData();
    single.set('id', 'u1');
    single.append('roles', 'admin');

    await updateUserRoles(single);

    expect(writeRbac).toHaveBeenCalledWith({
      users: db.users,
      roles: { u1: 'admin' },
      permissions: {},
    });

    (readRbac as jest.Mock).mockResolvedValue({
      users: { ...db.users },
      roles: {},
      permissions: {},
    });
    (writeRbac as jest.Mock).mockClear();

    const multi = new FormData();
    multi.set('id', 'u1');
    multi.append('roles', 'editor');
    multi.append('roles', 'viewer');

    await updateUserRoles(multi);

    expect(writeRbac).toHaveBeenCalledWith({
      users: db.users,
      roles: { u1: ['editor', 'viewer'] },
      permissions: {},
    });
  });
});

describe('inviteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes password and stores roles', async () => {
    (argon2.hash as jest.Mock).mockResolvedValue('hashed');
    (ulid as jest.Mock).mockReturnValue('uid123');
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    const form = new FormData();
    form.set('name', 'New User');
    form.set('email', 'new@example.com');
    form.set('password', 'secret');
    form.append('roles', 'editor');
    form.append('roles', 'viewer');

    await inviteUser(form);

    expect(argon2.hash).toHaveBeenCalledWith('secret');
    expect(writeRbac).toHaveBeenCalledWith({
      users: {
        uid123: {
          id: 'uid123',
          name: 'New User',
          email: 'new@example.com',
          password: 'hashed',
        },
      },
      roles: { uid123: ['editor', 'viewer'] },
      permissions: {},
    });
  });
});

describe('updateRolePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes permissions for a role', async () => {
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    const form = new FormData();
    form.set('role', 'admin');
    form.append('permissions', 'read');
    form.append('permissions', 'write');

    await updateRolePermissions(form);

    expect(writeRbac).toHaveBeenCalledWith({
      users: {},
      roles: {},
      permissions: { admin: ['read', 'write'] },
    });
  });
});

