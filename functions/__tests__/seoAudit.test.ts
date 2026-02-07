import { promises as fs } from 'node:fs';
import seoAudit from '../src/seoAudit';
import { runSeoAudit } from '@acme/lib/seoAudit';
import { trackEvent } from '@acme/platform-core/analytics';
import { sendCampaignEmail } from '@acme/email';

const mockFiles: Record<string, string> = {};
const directories = new Set<string>();

jest.mock('node:fs', () => {
  const path = require('node:path');
  return {
    promises: {
      mkdir: jest.fn(async (dir: string) => {
        directories.add(dir);
      }),
      appendFile: jest.fn(async (file: string, data: string) => {
        const dir = path.dirname(file);
        directories.add(dir);
        mockFiles[file] = (mockFiles[file] || '') + data;
      }),
      readdir: jest.fn(async (dir: string, opts: { withFileTypes?: boolean }) => {
        const children = Array.from(directories).filter(d => path.dirname(d) === dir);
        if (opts && opts.withFileTypes) {
          return children.map(name => ({
            name: path.basename(name),
            isDirectory: () => true,
            isFile: () => false,
          }));
        }
        return children.map(name => path.basename(name));
      }),
      readFile: jest.fn(async (file: string) => mockFiles[file] ?? ''),
    },
  };
});

jest.mock('@acme/lib/seoAudit', () => ({ runSeoAudit: jest.fn() }));
jest.mock('@acme/platform-core/analytics', () => ({ trackEvent: jest.fn() }));
jest.mock('@acme/email', () => ({ sendCampaignEmail: jest.fn() }));
jest.mock('@acme/platform-core/dataRoot', () => ({ DATA_ROOT: '/data' }));
jest.mock('@acme/config/env/core', () => ({ coreEnv: { STOCK_ALERT_RECIPIENT: 'alerts@example.com' } }));

const runSeoAuditMock = jest.mocked(runSeoAudit);
const trackEventMock = jest.mocked(trackEvent);
const sendCampaignEmailMock = jest.mocked(sendCampaignEmail);

beforeEach(() => {
  trackEventMock.mockReset();
  sendCampaignEmailMock.mockReset();
  runSeoAuditMock.mockReset();
  directories.clear();
  for (const key in mockFiles) delete mockFiles[key];
});

describe('seoAudit scheduled', () => {
  it('logs audit and no email for high score', async () => {
    directories.add('/data/high-shop');
    runSeoAuditMock.mockResolvedValueOnce({ score: 90, recommendations: [] });

    await seoAudit.scheduled();

    expect(trackEventMock).toHaveBeenCalledWith('high-shop', expect.objectContaining({ score: 90, success: true }));
    expect(sendCampaignEmailMock).not.toHaveBeenCalled();

    const content = await fs.readFile('/data/high-shop/seo-audits.jsonl', 'utf8');
    const record = JSON.parse(content.trim());
    expect(record.score).toBe(90);
  });

  it('sends alert email for low score', async () => {
    directories.add('/data/low-shop');
    runSeoAuditMock.mockResolvedValueOnce({ score: 70, recommendations: [] });

    await seoAudit.scheduled();

    expect(trackEventMock).toHaveBeenCalledWith('low-shop', expect.objectContaining({ score: 70, success: true }));
    expect(sendCampaignEmailMock).toHaveBeenCalledWith({
      to: 'alerts@example.com',
      subject: 'Low SEO score for low-shop',
      html: '<p>Latest SEO audit score: 70</p>',
    });

    const content = await fs.readFile('/data/low-shop/seo-audits.jsonl', 'utf8');
    const record = JSON.parse(content.trim());
    expect(record.score).toBe(70);
  });

  it('tracks failure when audit rejects', async () => {
    const error = new Error('network fail');
    directories.add('/data/error-shop');
    runSeoAuditMock.mockRejectedValueOnce(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await seoAudit.scheduled();

    expect(consoleErrorSpy).toHaveBeenCalledWith('seo audit failed for error-shop', error);
    expect(trackEventMock).toHaveBeenCalledWith('error-shop', {
      type: 'audit_complete',
      success: false,
      error: error.message,
    });

    consoleErrorSpy.mockRestore();
  });

  it('skips non-directory entries in DATA_ROOT', async () => {
    directories.add('/data/shop-dir');
    const readdirMock = fs.readdir as unknown as jest.Mock;
    readdirMock.mockImplementationOnce(
      async (dir: string, opts: { withFileTypes?: boolean }) => {
        const path = require('node:path');
        if (opts && opts.withFileTypes) {
          return [
            {
              name: 'file.txt',
              isDirectory: () => false,
              isFile: () => true,
            },
            {
              name: 'shop-dir',
              isDirectory: () => true,
              isFile: () => false,
            },
          ];
        }
        return ['file.txt', 'shop-dir'].map((name) => path.basename(name));
      },
    );

    runSeoAuditMock.mockResolvedValueOnce({
      score: 85,
      recommendations: [],
    });

    await seoAudit.scheduled();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(
      'shop-dir',
      expect.objectContaining({ success: true }),
    );
  });
});
