import { jest } from '@jest/globals';

const pinoInstance = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const pinoMock = jest.fn(() => pinoInstance);

jest.mock('pino', () => ({
  __esModule: true,
  default: (...args: unknown[]) => pinoMock(...args),
}));

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    pinoMock.mockClear();
    pinoInstance.error.mockClear();
    pinoInstance.warn.mockClear();
    pinoInstance.info.mockClear();
    pinoInstance.debug.mockClear();
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  it('forwards messages and metadata to the pino instance', async () => {
    const { logger } = await import('../logger');
    const meta = { id: 1 };

    logger.error('error message', meta);
    logger.warn('warn message', meta);
    logger.info('info message', meta);
    logger.debug('debug message', meta);

    expect(pinoInstance.error).toHaveBeenCalledWith(meta, 'error message');
    expect(pinoInstance.warn).toHaveBeenCalledWith(meta, 'warn message');
    expect(pinoInstance.info).toHaveBeenCalledWith(meta, 'info message');
    expect(pinoInstance.debug).toHaveBeenCalledWith(meta, 'debug message');
  });

  it('forwards Error objects to the pino instance', async () => {
    const { logger } = await import('../logger');
    const err = new Error('boom');
    logger.error('msg', err);
    expect(pinoInstance.error).toHaveBeenCalledWith(err, 'msg');
  });

  it('defaults to info level in production', async () => {
    process.env.NODE_ENV = 'production';
    await import('../logger');
    expect(pinoMock).toHaveBeenCalledWith({ level: 'info' });
  });

  it('defaults to debug level when not in production', async () => {
    process.env.NODE_ENV = 'development';
    await import('../logger');
    expect(pinoMock).toHaveBeenCalledWith({ level: 'debug' });
  });

  it('uses LOG_LEVEL when provided', async () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'warn';
    await import('../logger');
    expect(pinoMock).toHaveBeenCalledWith({ level: 'warn' });
  });
});

