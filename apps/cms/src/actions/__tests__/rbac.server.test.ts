/** @jest-environment node */

jest.mock('../../lib/server/rbacStore', () => ({
  readRbac: jest.fn(),
  writeRbac: jest.fn(),
}));

jest.mock('argon2', () => ({ hash: jest.fn() }));
jest.mock('ulid', () => ({ ulid: jest.fn() }));
import {
  listUsers,
  updateUserRoles,
  inviteUser,
  updateRolePermissions,
} from '../rbac.server';
import { readRbac, writeRbac } from '../../lib/server/rbacStore';
import argon2 from 'argon2';
import { ulid } from 'ulid';

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

    expect(writeRbac).toHaveBeenCalledTimes(1);
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

    expect(writeRbac).toHaveBeenCalledTimes(1);
    expect(writeRbac).toHaveBeenCalledWith({
      users: db.users,
      roles: { u1: ['editor', 'viewer'] },
      permissions: {},
    });
  });

  it('persists undefined when roles are omitted', async () => {
    const db = {
      users: { u1: { id: 'u1', name: 'User', email: 'u1@example.com', password: 'hash' } },
      roles: { u1: 'admin' },
      permissions: {},
    };

    (readRbac as jest.Mock).mockResolvedValue({
      users: { ...db.users },
      roles: { ...db.roles },
      permissions: {},
    });

    const form = new FormData();
    form.set('id', 'u1');

    await updateUserRoles(form);

    expect(writeRbac).toHaveBeenCalledTimes(1);
    expect(writeRbac).toHaveBeenCalledWith({
      users: db.users,
      roles: { u1: undefined },
      permissions: {},
    });
  });
});

describe('inviteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores single role as string', async () => {
    (argon2.hash as jest.Mock).mockResolvedValue('hashed');
    (ulid as jest.Mock).mockReturnValue('uid123');
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });

    const form = new FormData();
    form.set('name', 'Solo User');
    form.set('email', 'solo@example.com');
    form.set('password', 'secret');
    form.append('roles', 'editor');

    await inviteUser(form);

    expect(writeRbac).toHaveBeenCalledTimes(1);
    expect(writeRbac).toHaveBeenCalledWith({
      users: {
        uid123: {
          id: 'uid123',
          name: 'Solo User',
          email: 'solo@example.com',
          password: 'hashed',
        },
      },
      roles: { uid123: 'editor' },
      permissions: {},
    });
    const db = (writeRbac as jest.Mock).mock.calls[0][0];
    expect(typeof db.roles.uid123).toBe('string');
  });

  it('hashes password, assigns roles and persists', async () => {
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

    expect(ulid).toHaveBeenCalledTimes(1);
    expect(argon2.hash).toHaveBeenCalledWith('secret');
    expect(writeRbac).toHaveBeenCalledTimes(1);
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

    expect(writeRbac).toHaveBeenCalledTimes(1);
    expect(writeRbac).toHaveBeenCalledWith({
      users: {},
      roles: {},
      permissions: { admin: ['read', 'write'] },
    });
  });
});
