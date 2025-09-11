import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(() => ({ status: 0 })),
}));
jest.mock('../src/db', () => ({ prisma: {} }));

describe('deployShop', () => {
  function withTempDir(run: (dir: string) => void | Promise<void>): Promise<void> {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-'));
    process.chdir(dir);
    return Promise.resolve(run(dir)).finally(() => {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    });
  }

  it('writes deploy.json and returns preview url', async () => {
    await withTempDir(async () => {
      const { deployShop } = await import('../src/createShop/deploy');
      const file = path.join('data', 'shops', 'shopx', 'deploy.json');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const result = deployShop('shopx', 'shop.example.com');
      const written = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(written.previewUrl).toContain('shopx');
      expect(result.previewUrl).toContain('shopx');
      expect(result.instructions).toContain('CNAME');
      expect(result.status).toBe('success');
    });
  });

  it('replaces existing SESSION_SECRET in env file', async () => {
    await withTempDir(async () => {
      const id = 'shop-env';
      const appDir = path.join('apps', id);
      fs.mkdirSync(appDir, { recursive: true });
      const envPath = path.join(appDir, '.env');
      fs.writeFileSync(envPath, 'SESSION_SECRET=oldsecret\nOTHER=1');
      const adapter = {
        scaffold: () => {},
        deploy: () => ({ status: 'success' as const }),
        writeDeployInfo: () => {},
      };
      const { deployShop } = await import('../src/createShop/deploy');
      deployShop(id, undefined, adapter);
      const env = fs.readFileSync(envPath, 'utf8');
      expect(env).not.toMatch(/SESSION_SECRET=oldsecret/);
      expect(env).toMatch(/SESSION_SECRET=[a-f0-9]{64}/);
    });
  });

  it('adds SESSION_SECRET when missing from env file', async () => {
    await withTempDir(async () => {
      const id = 'shop-env-missing';
      const appDir = path.join('apps', id);
      fs.mkdirSync(appDir, { recursive: true });
      const envPath = path.join(appDir, '.env');
      fs.writeFileSync(envPath, 'OTHER=1');
      const adapter = {
        scaffold: () => {},
        deploy: () => ({ status: 'success' as const }),
        writeDeployInfo: () => {},
      };
      const { deployShop } = await import('../src/createShop/deploy');
      deployShop(id, undefined, adapter);
      const env = fs.readFileSync(envPath, 'utf8');
      expect(env).toMatch(/OTHER=1/);
      expect(env).toMatch(/SESSION_SECRET=[a-f0-9]{64}/);
    });
  });

  it('returns error when scaffold fails', async () => {
    await withTempDir(async () => {
      const adapter = {
        scaffold: () => {
          throw new Error('fail');
        },
        deploy: jest.fn(() => ({ status: 'success' as const })),
        writeDeployInfo: jest.fn(),
      };
      const { deployShop } = await import('../src/createShop/deploy');
      const result = deployShop('shop-fail', undefined, adapter);
      expect(result.status).toBe('error');
      expect(result.error).toBe('fail');
      expect(adapter.deploy).toHaveBeenCalled();
      expect(adapter.writeDeployInfo).toHaveBeenCalledWith('shop-fail', result);
    });
  });
});
