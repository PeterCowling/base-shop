import {
  cleanupEnv,
  mockHasProviderErrorFields,
  mockResendSend,
  mockSendMail,
  mockSendgridSend,
  mockSanitizeHtml,
  resetMocks,
  setupEnv,
} from './sendCampaignTestUtils';

describe('sendCampaignEmail retry/backoff paths', () => {
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

  it('retries with exponential backoff on retryable error', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    const { ProviderError } = await import('../providers/types');
    mockSendgridSend
      .mockRejectedValueOnce(new ProviderError('temporary', true))
      .mockRejectedValueOnce(new ProviderError('temporary', true))
      .mockResolvedValueOnce(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockImplementation();

    setupEnv();

    const { sendCampaignEmail } = await import('../index');

    const promise = sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    // Await the next macrotask to allow dynamic imports to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

    await promise;

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);
    expect(mockResendSend).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it('stops retrying when provider error indicates non-retryable', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    mockSendgridSend
      .mockRejectedValueOnce({ message: 'x', retryable: false })
      .mockResolvedValueOnce(undefined);
    mockResendSend.mockResolvedValue(undefined);
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockReturnValue(true);

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
    timeoutSpy.mockRestore();
  });

  it('retries when provider error lacks retryable property', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    mockSendgridSend.mockRejectedValue({ message: 'x' });
    mockResendSend.mockResolvedValue(undefined);
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockReturnValue(true);

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    timeoutSpy.mockRestore();
  });

  it('retries when error lacks provider fields', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout');
    mockSendgridSend.mockRejectedValue({});
    mockResendSend.mockResolvedValue(undefined);
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);
    mockHasProviderErrorFields.mockReturnValue(false);

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    timeoutSpy.mockRestore();
  });
});
