import { logger } from "@acme/lib/logger";

import {
  cleanupEnv,
  mockHasProviderErrorFields,
  mockResendSend,
  mockSanitizeHtml,
  mockSendgridSend,
  mockSendMail,
  resetMocks,
  setupEnv,
} from './sendCampaignTestUtils';

describe('sendCampaignEmail failure paths', () => {
  beforeEach(() => {
    jest.useRealTimers();
    resetMocks();
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.clearAllTimers();
    cleanupEnv();
  });

  it('falls back to alternate provider when primary fails', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    const { ProviderError } = await import('../providers/types');
    mockSendgridSend.mockRejectedValue(new ProviderError('fail', false));
    mockResendSend.mockResolvedValue(undefined);
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
      text: 'HTML',
    });
    expect(mockResendSend).toHaveBeenCalledWith({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
      text: 'HTML',
    });
    timeoutSpy.mockRestore();
  });

  it('falls back to Nodemailer when all providers fail', async () => {
    const { ProviderError } = await import('../providers/types');
    mockSendgridSend.mockRejectedValue(new ProviderError('sg fail', false));
    mockResendSend.mockRejectedValue(new ProviderError('rs fail', false));
    mockSendMail.mockResolvedValue(undefined);
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('propagates Nodemailer error after other providers fail', async () => {
    const { ProviderError } = await import('../providers/types');
    const sgError = new ProviderError('sg fail', false);
    const rsError = new ProviderError('rs fail', false);
    const smtpError = new Error('smtp fail');

    mockSendgridSend.mockRejectedValue(sgError);
    mockResendSend.mockRejectedValue(rsError);
    mockSendMail.mockRejectedValue(smtpError);
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    setupEnv();

    const { sendCampaignEmail } = await import('../send');

    await expect(
      sendCampaignEmail({
        to: 'to@example.com',
        subject: 'Subject',
        html: '<p>HTML</p>',
      }),
    ).rejects.toBe(smtpError);

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendgridSend.mock.invocationCallOrder[0]).toBeLessThan(
      mockResendSend.mock.invocationCallOrder[0],
    );
    expect(mockResendSend.mock.invocationCallOrder[0]).toBeLessThan(
      mockSendMail.mock.invocationCallOrder[0],
    );
  });

  it('falls back to alternate provider when Nodemailer fails', async () => {
    mockSendMail.mockRejectedValue(new Error('smtp fail'));
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockResolvedValue(undefined);
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SENDGRID_API_KEY = 'sg';
    process.env.RESEND_API_KEY = 'rs';
    process.env.CAMPAIGN_FROM = 'campaign@example.com';

    const { sendCampaignEmail } = await import('../send');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(
      mockSendMail.mock.invocationCallOrder[0],
    ).toBeLessThan(mockSendgridSend.mock.invocationCallOrder[0]);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('rejects when recipient email is invalid', async () => {
    const { sendCampaignEmail } = await import('../send');

    await expect(
      sendCampaignEmail({
        to: 'invalid',
        subject: 'Subject',
        html: '<p>HTML</p>',
      }),
    ).rejects.toThrow('Invalid recipient email address: invalid');
  });

  it('rejects when subject is empty', async () => {
    const { sendCampaignEmail } = await import('../send');

    await expect(
      sendCampaignEmail({
        to: 'to@example.com',
        subject: '   ',
        html: '<p>HTML</p>',
      }),
    ).rejects.toThrow('Email subject is required.');
  });

  it('throws when EMAIL_PROVIDER is invalid', async () => {
    const originalProvider = process.env.EMAIL_PROVIDER;
    const { sendCampaignEmail } = await import('../send');
    process.env.EMAIL_PROVIDER = 'invalid';
    await expect(
      sendCampaignEmail({
        to: 'to@example.com',
        subject: 'Subject',
        html: '<p>HTML</p>',
        sanitize: false,
      }),
    ).rejects.toThrow(
      'Unsupported EMAIL_PROVIDER "invalid". Available providers: sendgrid, resend, smtp',
    );
    process.env.EMAIL_PROVIDER = originalProvider;
  });

  it('falls back to Nodemailer when no providers are available', async () => {
    mockSendgridSend.mockImplementation();
    mockResendSend.mockImplementation();
    mockSendMail.mockResolvedValue(undefined);
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.CAMPAIGN_FROM = 'campaign@example.com';

    const { sendCampaignEmail } = await import('../send');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('logs provider, campaign, and recipient on failure', async () => {
    const { ProviderError } = await import('../providers/types');
    mockSendgridSend.mockRejectedValue(new ProviderError('fail', false));
    mockResendSend.mockResolvedValue(undefined);
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    const { logger } = await import("@acme/lib/logger");
    const consoleSpy = jest.fn();
    const originalWarn = logger.warn;
    logger.warn = consoleSpy as any;

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
      campaignId: 'camp123',
    });

    expect(consoleSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [
          'Campaign email send failed',
          expect.objectContaining({
            provider: 'sendgrid',
            recipient: 'to@example.com',
            campaignId: 'camp123',
          }),
        ],
      ]),
    );

    logger.warn = originalWarn;
  });
});
