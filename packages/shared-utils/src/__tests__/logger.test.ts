import { jest } from '@jest/globals';

let pinoInstance: {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
};

const debugOutput = jest.fn();

const pinoMock = jest.fn((opts: { level?: string } = {}) => {
  pinoInstance = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn((...args) => {
      if (opts.level === 'debug') {
        debugOutput(...args);
      }
    }),
  };
  return pinoInstance;
});

jest.mock('pino', () => ({
  __esModule: true,
  default: (...args: unknown[]) => pinoMock(...args),
}));

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    pinoMock.mockClear();
    debugOutput.mockClear();
    // pinoInstance is created on import
    // so guard against it being undefined
    if (pinoInstance) {
      pinoInstance.error.mockClear();
      pinoInstance.warn.mockClear();
      pinoInstance.info.mockClear();
      pinoInstance.debug.mockClear();
    }
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  it.each([
    ['error'],
    ['warn'],
    ['info'],
    ['debug'],
  ])('%s forwards message and metadata to the pino instance', async (level) => {
    const { logger } = await import('../logger');
    const meta = { id: 1 };
    const message = `${level} message`;

    // @ts-expect-error - index signature for logger methods
    logger[level](message, meta);
    // @ts-expect-error - index signature for pino instance methods
    expect(pinoInstance[level]).toHaveBeenCalledWith(meta, message);
  });

  it.each([
    ['error'],
    ['warn'],
    ['info'],
    ['debug'],
  ])('%s forwards message with empty metadata when omitted', async (level) => {
    const { logger } = await import('../logger');
    const message = `${level} only`;
    // @ts-expect-error - index signature for logger methods
    logger[level](message);
    // @ts-expect-error - index signature for pino instance methods
    expect(pinoInstance[level]).toHaveBeenCalledWith({}, message);
  });

  it('logs plain objects and Error instances appropriately', async () => {
    const { logger } = await import('../logger');
    const obj = { id: 1 };
    const err = new Error('boom');
    logger.error('object meta', obj);
    logger.error('error meta', err);
    expect(pinoInstance.error).toHaveBeenNthCalledWith(1, obj, 'object meta');
    expect(pinoInstance.error).toHaveBeenNthCalledWith(2, err, 'error meta');
  });

  it.each([
    [{ NODE_ENV: 'production' }, 'info'],
    [{ NODE_ENV: 'development' }, 'debug'],
    [{ NODE_ENV: 'production', LOG_LEVEL: 'warn' }, 'warn'],
  ])('sets level based on LOG_LEVEL and NODE_ENV', async (env, level) => {
    Object.assign(process.env, env);
    await import('../logger');
    expect(pinoMock).toHaveBeenCalledWith({ level });
  });

  it('suppresses debug output when level \u2265 info', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('../logger');
    logger.debug('hidden');
    expect(debugOutput).not.toHaveBeenCalled();
  });

  it('emits debug output when LOG_LEVEL=debug', async () => {
    process.env.LOG_LEVEL = 'debug';
    const { logger } = await import('../logger');
    logger.debug('visible');
    expect(debugOutput).toHaveBeenCalledWith({}, 'visible');
  });

  it('includes request context when present', async () => {
    const { logger, setRequestContext } = await import('../index');
    setRequestContext({
      requestId: 'req-123',
      service: 'test-service',
      env: 'dev',
    });
    logger.info('message', { foo: 'bar' });
    expect(pinoInstance.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-123',
        service: 'test-service',
        env: 'dev',
        foo: 'bar',
      }),
      'message',
    );
  });
});
