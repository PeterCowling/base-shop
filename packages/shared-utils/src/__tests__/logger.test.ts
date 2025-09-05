import { jest } from '@jest/globals';

const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

jest.mock('pino', () => ({
  __esModule: true,
  default: () => ({
    info: (meta: unknown, msg: string) => console.info(meta, msg),
    warn: (meta: unknown, msg: string) => console.warn(meta, msg),
    error: (meta: unknown, msg: string) => console.error(meta, msg),
    debug: (meta: unknown, msg: string) => console.debug(meta, msg),
  }),
}));

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
    debugSpy.mockClear();
  });

  afterAll(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('logs messages to the matching console method with metadata', async () => {
    const { logger } = await import('../logger');
    const meta = { id: 1 };

    logger.info('info message', meta);
    logger.warn('warn message', meta);
    logger.error('error message', meta);
    logger.debug('debug message', meta);

    expect(console.info).toHaveBeenCalledWith(meta, 'info message');
    expect(console.warn).toHaveBeenCalledWith(meta, 'warn message');
    expect(console.error).toHaveBeenCalledWith(meta, 'error message');
    expect(console.debug).toHaveBeenCalledWith(meta, 'debug message');
  });

  it('supports colored messages and optional metadata', async () => {
    const { logger } = await import('../logger');
    const colorMsg = '\u001b[32mgreen\u001b[0m';

    logger.info(colorMsg);

    expect(console.info).toHaveBeenCalledWith({}, colorMsg);
  });
});
