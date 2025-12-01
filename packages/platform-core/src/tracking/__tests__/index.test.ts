import { jest } from "@jest/globals";

const getTrackingStatusMock = jest.fn();
jest.mock("../../shipping", () => ({
  getTrackingStatus: getTrackingStatusMock,
}));
jest.mock("../../services/emailService", () => ({
  getEmailService: () => ({ sendEmail: jest.fn() }),
}));

import {
  getTrackingDashboard,
  notifyStatusChange,
} from "../../internal/tracking";

describe('getTrackingDashboard', () => {
  beforeEach(() => {
    getTrackingStatusMock.mockReset();
  });

  it('uses custom providers and defaults unknown providers', async () => {
    const custom = jest.fn().mockResolvedValue({
      status: 'Custom',
      steps: [{ label: 'Custom', complete: true }],
    });
    getTrackingStatusMock.mockResolvedValue({ status: 'Builtin', steps: [] });

    const items = [
      { id: '1', type: 'shipment' as const, provider: 'ups', trackingNumber: '123' },
      { id: '2', type: 'shipment' as const, provider: 'mystery', trackingNumber: '999' },
      { id: '3', type: 'shipment' as const, provider: 'dhl', trackingNumber: '456' },
    ];

    const result = await getTrackingDashboard(items, { ups: custom });

    expect(custom).toHaveBeenCalledWith('123');
    expect(getTrackingStatusMock).toHaveBeenCalledWith({ provider: 'dhl', trackingNumber: '456' });
    expect(result).toEqual([
      { ...items[0], status: 'Custom', steps: [{ label: 'Custom', complete: true }] },
      { ...items[1], status: null, steps: [] },
      { ...items[2], status: 'Builtin', steps: [] },
    ]);
  });
});

describe('notifyStatusChange', () => {
  let fetchMock: jest.Mock;
  let emailMock: { sendEmail: jest.Mock };

  const item = { id: '1', type: 'shipment' as const, provider: 'ups', trackingNumber: '123' };

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error - override global fetch
    global.fetch = fetchMock;
    emailMock = { sendEmail: jest.fn() };
    delete process.env.TWILIO_SID;
    delete process.env.TWILIO_TOKEN;
    delete process.env.TWILIO_FROM;
  });

  it('does nothing when previous equals current', async () => {
    process.env.TWILIO_SID = 'sid';
    process.env.TWILIO_TOKEN = 'token';
    process.env.TWILIO_FROM = 'from';

    await notifyStatusChange(
      { email: 'a@example.com', phone: '+123' },
      item,
      'same',
      'same',
      emailMock as any,
    );

    expect(emailMock.sendEmail).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends email only when phone is missing', async () => {
    process.env.TWILIO_SID = 'sid';
    process.env.TWILIO_TOKEN = 'token';
    process.env.TWILIO_FROM = 'from';

    await notifyStatusChange(
      { email: 'a@example.com' },
      item,
      'old',
      'new',
      emailMock as any,
    );

    expect(emailMock.sendEmail).toHaveBeenCalledWith(
      'a@example.com',
      'Tracking update',
      'Tracking update for 1: new',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends sms only when email is missing', async () => {
    process.env.TWILIO_SID = 'sid';
    process.env.TWILIO_TOKEN = 'token';
    process.env.TWILIO_FROM = 'from';

    await notifyStatusChange(
      { phone: '+123' },
      item,
      'old',
      'new',
      emailMock as any,
    );

    expect(emailMock.sendEmail).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.twilio.com/2010-04-01/Accounts/sid/Messages.json',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends both email and sms when both contacts provided', async () => {
    process.env.TWILIO_SID = 'sid';
    process.env.TWILIO_TOKEN = 'token';
    process.env.TWILIO_FROM = 'from';

    await notifyStatusChange(
      { email: 'a@example.com', phone: '+123' },
      item,
      'old',
      'new',
      emailMock as any,
    );

    expect(emailMock.sendEmail).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('skips sms when twilio env vars are missing', async () => {
    await notifyStatusChange(
      { phone: '+123' },
      item,
      'old',
      'new',
      emailMock as any,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
