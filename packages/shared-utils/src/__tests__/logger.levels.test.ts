import { jest } from '@jest/globals';

const levelOrder: Record<string, number> = {
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function createMockPino(opts: { level: string }) {
  const threshold = levelOrder[opts.level];

  const maybeCall = (method: keyof typeof levelOrder) =>
    (...args: unknown[]) => {
      if (levelOrder[method] <= threshold) {
        try {
          (console as any)[method](...args);
        } catch (err) {
          console.warn('Logging error:', err);
        }
      }
    };

  return {
    error: maybeCall('error'),
    warn: maybeCall('warn'),
    info: maybeCall('info'),
    debug: maybeCall('debug'),
  } as const;
}

const pinoMock = jest.fn((opts: { level: string }) => createMockPino(opts));

jest.mock('pino', () => ({
  __esModule: true,
  default: (opts: { level: string }) => pinoMock(opts),
}));

describe('logger levels', () => {
  beforeEach(() => {
    jest.resetModules();
    pinoMock.mockClear();
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  const scenarios: [string, { error: boolean; warn: boolean; info: boolean; debug: boolean }][] = [
    ['debug', { error: true, warn: true, info: true, debug: true }],
    ['info', { error: true, warn: true, info: true, debug: false }],
    ['warn', { error: true, warn: true, info: false, debug: false }],
    ['error', { error: true, warn: false, info: false, debug: false }],
    ['silent', { error: false, warn: false, info: false, debug: false }],
  ];

  test.each(scenarios)('respects %s level', async (level, expected) => {
    process.env.LOG_LEVEL = level;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    const { logger } = await import('../logger');

    logger.error('e');
    logger.warn('w');
    logger.info('i');
    logger.debug('d');

    if (expected.error) {
      expect(errorSpy).toHaveBeenCalled();
    } else {
      expect(errorSpy).not.toHaveBeenCalled();
    }
    if (expected.warn) {
      expect(warnSpy).toHaveBeenCalled();
    } else {
      expect(warnSpy).not.toHaveBeenCalled();
    }
    if (expected.info) {
      expect(infoSpy).toHaveBeenCalled();
    } else {
      expect(infoSpy).not.toHaveBeenCalled();
    }
    if (expected.debug) {
      expect(debugSpy).toHaveBeenCalled();
    } else {
      expect(debugSpy).not.toHaveBeenCalled();
    }

    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('forwards multiple arguments to console', async () => {
    process.env.LOG_LEVEL = 'debug';
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { logger } = await import('../logger');
    const meta = { foo: 1 };
    logger.info('message', meta);
    expect(infoSpy).toHaveBeenCalledWith(meta, 'message');
    infoSpy.mockRestore();
  });

  it('does not propagate errors from console methods', async () => {
    process.env.LOG_LEVEL = 'error';
    const err = new Error('fail');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      throw err;
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { logger } = await import('../logger');
    expect(() => logger.error('boom')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('Logging error:', err);
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
