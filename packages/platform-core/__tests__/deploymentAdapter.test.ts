import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const spawnSyncMock = jest.fn();
jest.mock('child_process', () => ({
  spawnSync: spawnSyncMock,
}));

describe('CloudflareDeploymentAdapter', () => {
  it('throws when scaffold fails', async () => {
    spawnSyncMock.mockReturnValueOnce({ status: 1 });
    const { CloudflareDeploymentAdapter } = await import('../src/createShop/deploymentAdapter');
    const adapter = new CloudflareDeploymentAdapter();
    expect(() => adapter.scaffold('app')).toThrow();
  });

  it('returns instructions only when domain provided', async () => {
    const { CloudflareDeploymentAdapter } = await import('../src/createShop/deploymentAdapter');
    const adapter = new CloudflareDeploymentAdapter();
    const withDomain = adapter.deploy('shop', 'example.com');
    expect(withDomain.instructions).toContain('example.com');
    const withoutDomain = adapter.deploy('shop');
    expect(withoutDomain.instructions).toBeUndefined();
  });

  it('swallows errors when writing deploy info', async () => {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-'));
    process.chdir(dir);
    const { CloudflareDeploymentAdapter } = await import('../src/createShop/deploymentAdapter');
    const adapter = new CloudflareDeploymentAdapter();
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('fail');
    });
    expect(() =>
      adapter.writeDeployInfo('shop', {
        status: 'success',
        previewUrl: '',
        instructions: undefined,
      }),
    ).not.toThrow();
    expect(fs.writeFileSync).toHaveBeenCalled();
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

