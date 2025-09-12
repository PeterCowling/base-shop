import {
  cleanupEnv,
  mockResendSend,
  mockSendMail,
  mockSendgridSend,
  mockSanitizeHtml,
  resetMocks,
  setupEnv,
} from './sendCampaignTestUtils';

describe('sendCampaignEmail success paths', () => {
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

  it('derives text from HTML when missing', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import('../send');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello <strong>world</strong></p>',
      sanitize: false,
    });

    expect(mockSanitizeHtml).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello <strong>world</strong></p>',
      text: 'Hello world',
    });
  });

  it('forwards provided text without deriving from HTML', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation();

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello <strong>world</strong></p>',
      text: 'Custom text',
      sanitize: false,
    });

    expect(mockSanitizeHtml).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello <strong>world</strong></p>',
      text: 'Custom text',
    });
  });

  it('does not call Resend when using Sendgrid', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import('../send');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>HTML</p>',
      sanitize: false,
    });

    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('sanitizes HTML and derives text', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) =>
      html.replace(/<script[\s\S]*?<\/script>/gi, ''),
    );

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello</p><script>alert(1)</script>',
    });

    expect(mockSanitizeHtml).toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
  });

  it('preserves table elements and styles during sanitization', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import('../index');
    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      html: '<table><tr><td style="color:red">x</td></tr></table>',
    });

    expect(mockSanitizeHtml).toHaveBeenCalled();
    const sentHtml = (mockSendgridSend.mock.calls[0][0] as { html: string }).html;
    expect(sentHtml).toContain('<table>');
    expect(sentHtml).toContain('<tr>');
    expect(sentHtml).toContain('<td');
    expect(sentHtml).toContain('style="color:red"');
  });

  it('renders templates before sending', async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockResendSend.mockImplementation();
    mockSendMail.mockImplementation();
    mockSanitizeHtml.mockImplementation((html: string) => html);

    setupEnv();

    const { registerTemplate, sendCampaignEmail } = await import('../index');
    registerTemplate('welcome', '<p>Hello {{name}}</p>');

    await sendCampaignEmail({
      to: 'to@example.com',
      subject: 'Subject',
      templateId: 'welcome',
      variables: { name: 'Alice' },
    });

    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'to@example.com',
        subject: 'Subject',
        html: '<p>Hello Alice</p>',
        text: 'Hello Alice',
      }),
    );
  });
});
