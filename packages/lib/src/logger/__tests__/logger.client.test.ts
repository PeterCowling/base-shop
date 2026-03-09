/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

describe('client logger — level filtering', () => {
  let debugSpy: ReturnType<typeof jest.spyOn>;
  let infoSpy: ReturnType<typeof jest.spyOn>;
  let warnSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-01: debug suppressed when level=info
  it('TC-01: does not call console.debug when currentLevel is info', async () => {
    const { setLogLevel, default: logger } = await import('../client.js');
    setLogLevel('info');
    logger.debug('x');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  // TC-02: debug emitted when level=debug
  it('TC-02: calls console.debug when currentLevel is debug', async () => {
    const { setLogLevel, default: logger } = await import('../client.js');
    setLogLevel('debug');
    logger.debug('x');
    expect(debugSpy).toHaveBeenCalledWith('x');
  });

  // TC-03: info suppressed when level=warn
  it('TC-03: does not call console.info after setLogLevel warn', async () => {
    const { setLogLevel, default: logger } = await import('../client.js');
    setLogLevel('warn');
    logger.info('x');
    expect(infoSpy).not.toHaveBeenCalled();
  });

  // TC-04: getLogLevel returns the set level
  it('TC-04: getLogLevel returns the level set by setLogLevel', async () => {
    const { setLogLevel, getLogLevel } = await import('../client.js');
    setLogLevel('error');
    expect(getLogLevel()).toBe('error');
  });

  // TC-09: error passes non-ZodError arg unchanged
  it('TC-09: logger.error passes non-ZodError arg through to console.error unchanged', async () => {
    const { setLogLevel, default: logger } = await import('../client.js');
    setLogLevel('error');
    const arg = { code: 42 };
    logger.error(arg);
    expect(errorSpy).toHaveBeenCalledWith(arg);
  });

  it('warn calls console.warn when level allows', async () => {
    const { setLogLevel, default: logger } = await import('../client.js');
    setLogLevel('warn');
    logger.warn('w');
    expect(warnSpy).toHaveBeenCalledWith('w');
  });
});

describe('client logger — env var initialisation', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_LOG_LEVEL;
    delete process.env.LOG_LEVEL;
  });

  // TC-05: NEXT_PUBLIC_LOG_LEVEL sets initial level
  it('TC-05: initial level is debug when NEXT_PUBLIC_LOG_LEVEL=debug', async () => {
    process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';
    jest.resetModules();
    const { getLogLevel } = await import('../client.js');
    expect(getLogLevel()).toBe('debug');
  });

  // TC-06: LOG_LEVEL fallback
  it('TC-06: initial level is warn when LOG_LEVEL=warn and no NEXT_PUBLIC_LOG_LEVEL', async () => {
    process.env.LOG_LEVEL = 'warn';
    jest.resetModules();
    const { getLogLevel } = await import('../client.js');
    expect(getLogLevel()).toBe('warn');
  });

  // TC-07: silent maps to none
  it('TC-07: initial level is none when NEXT_PUBLIC_LOG_LEVEL=silent', async () => {
    process.env.NEXT_PUBLIC_LOG_LEVEL = 'silent';
    jest.resetModules();
    const { getLogLevel } = await import('../client.js');
    expect(getLogLevel()).toBe('none');
  });

  // TC-08: defaults to info
  it('TC-08: initial level is info when no env var is set', async () => {
    jest.resetModules();
    const { getLogLevel } = await import('../client.js');
    expect(getLogLevel()).toBe('info');
  });
});
