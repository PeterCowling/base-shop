import { beforeEach, describe, expect, jest, test } from '@jest/globals';

let trackEvent: jest.Mock;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.doMock('@platform-core/analytics', () => ({
    __esModule: true,
    trackEvent: jest.fn().mockResolvedValue(undefined),
  }));
  trackEvent = require('@platform-core/analytics').trackEvent as jest.Mock;
});

describe('email hooks', () => {
  test.each([
    ['send', 'onSend', 'emitSend', 'email_sent'],
    ['open', 'onOpen', 'emitOpen', 'email_open'],
    ['click', 'onClick', 'emitClick', 'email_click'],
  ])('invokes %s handlers in parallel and tracks analytics', async (_label, on, emit, type) => {
    const hooks = await import('../src/hooks');
    const register = hooks[on as keyof typeof hooks] as (fn: any) => void;
    const trigger = hooks[emit as keyof typeof hooks] as (shop: string, payload: any) => Promise<void>;

    const order: string[] = [];
    register(async () => {
      order.push('a:start');
      await new Promise((res) =>
        setTimeout(() => {
          order.push('a:end');
          res();
        }, 50),
      );
    });
    register(async () => {
      order.push('b:start');
      await new Promise((res) =>
        setTimeout(() => {
          order.push('b:end');
          res();
        }, 10),
      );
    });

    await trigger('shop', { campaign: 'camp' });

    expect(order).toEqual(['a:start', 'b:start', 'b:end', 'a:end']);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('shop', { type, campaign: 'camp' });
  });
});
