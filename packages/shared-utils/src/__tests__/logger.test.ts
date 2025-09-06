import { jest } from '@jest/globals';

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  const priorities = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 } as const;
  const levels = Object.keys(priorities) as Array<keyof typeof priorities>;

  describe.each(levels)("respects LOG_LEVEL=%s", (level) => {
    it('logs only messages at or above the configured level', async () => {
      process.env.LOG_LEVEL = level;

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { logger } = await import('../logger');

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      const threshold = priorities[level];
      expect(debugSpy).toHaveBeenCalledTimes(threshold <= priorities.debug ? 1 : 0);
      expect(infoSpy).toHaveBeenCalledTimes(threshold <= priorities.info ? 1 : 0);
      expect(warnSpy).toHaveBeenCalledTimes(threshold <= priorities.warn ? 1 : 0);
      expect(errorSpy).toHaveBeenCalledTimes(threshold <= priorities.error ? 1 : 0);
    });
  });

  it('passes all arguments through to console methods', async () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { logger } = await import('../logger');
    const meta = { foo: 1 };

    logger.info('message', meta);

    expect(infoSpy).toHaveBeenCalledWith('message', meta);
  });

  it('catches errors thrown by console methods', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {
        throw new Error('fail');
      });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { logger } = await import('../logger');

    expect(() => logger.error('oops')).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
