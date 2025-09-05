import { describe, expect, test, beforeEach, jest } from '@jest/globals';

let trackEvent: jest.Mock;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.doMock('@platform-core/analytics', () => ({
    __esModule: true,
    trackEvent: jest.fn(),
  }));
  trackEvent = require('@platform-core/analytics').trackEvent as jest.Mock;
});

describe('email hooks analytics', () => {
  test('tracking with complete analytics context', async () => {
    const { emitSend } = await import('../src/hooks');
    await emitSend('shop1', { campaign: 'camp1' });
    expect(trackEvent).toHaveBeenCalledWith('shop1', {
      type: 'email_sent',
      campaign: 'camp1',
    });
  });

  test('tracking with missing user data to hit fallback branch', async () => {
    const { emitOpen } = await import('../src/hooks');
    await emitOpen('shop2', {} as any);
    expect(trackEvent).toHaveBeenCalledWith('shop2', {
      type: 'email_open',
      campaign: undefined,
    });
  });

  test('tracking click event', async () => {
    const { emitClick } = await import('../src/hooks');
    await emitClick('shop4', { campaign: 'camp4' });
    expect(trackEvent).toHaveBeenCalledWith('shop4', {
      type: 'email_click',
      campaign: 'camp4',
    });
  });

  test('unsupported event name path', async () => {
    const { onSend, emitSend } = await import('../src/hooks');
    onSend((shop) => trackEvent(shop, { type: 'email_unknown' } as any));
    trackEvent.mockClear();
    await emitSend('shop3', { campaign: 'camp3' });
    expect(trackEvent).toHaveBeenCalledWith('shop3', { type: 'email_unknown' });
  });
});

