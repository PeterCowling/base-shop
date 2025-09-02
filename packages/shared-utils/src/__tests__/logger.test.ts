import { jest } from '@jest/globals';

const baseLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const pinoMock = jest.fn(() => baseLogger);

jest.mock('pino', () => ({ __esModule: true, default: pinoMock }));

const originalNodeEnv = process.env.NODE_ENV;

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    Object.values(baseLogger).forEach(fn => fn.mockClear());
    pinoMock.mockClear();
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.LOG_LEVEL;
  });

  it('forwards messages and metadata and respects LOG_LEVEL', async () => {
    process.env.LOG_LEVEL = 'warn';
    const { logger } = await import('../logger');
    const meta = { test: true };

    logger.error('error msg', meta);
    logger.warn('warn msg', meta);
    logger.info('info msg', meta);
    logger.debug('debug msg', meta);

    expect(baseLogger.error).toHaveBeenCalledWith(meta, 'error msg');
    expect(baseLogger.warn).toHaveBeenCalledWith(meta, 'warn msg');
    expect(baseLogger.info).toHaveBeenCalledWith(meta, 'info msg');
    expect(baseLogger.debug).toHaveBeenCalledWith(meta, 'debug msg');

    expect(pinoMock).toHaveBeenCalledWith({ level: 'warn' });
  });

  it('defaults to info when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('../logger');
    logger.info('info msg');

    expect(pinoMock).toHaveBeenCalledWith({ level: 'info' });
  });

  it('defaults to debug when LOG_LEVEL and NODE_ENV are undefined', async () => {
    const { logger } = await import('../logger');
    logger.debug('msg');

    expect(pinoMock).toHaveBeenCalledWith({ level: 'debug' });
  });

  it('defaults to debug when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('../logger');
    logger.debug('debug msg');

    expect(pinoMock).toHaveBeenCalledWith({ level: 'debug' });
  });
});

