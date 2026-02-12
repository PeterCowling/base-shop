import * as serviceWorker from '../registerSW';

describe('registerServiceWorker', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(
    navigator,
    'serviceWorker',
  );

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
    }
  });

  it('TC-01: registers /sw.js when service workers are supported', async () => {
    let updateFoundHandler: (() => void) | null = null;
    const workerListeners: Record<string, () => void> = {};

    const installingWorker = {
      state: 'installed',
      addEventListener: jest.fn((event: string, handler: () => void) => {
        workerListeners[event] = handler;
      }),
    };

    const registration = {
      scope: '/',
      installing: installingWorker,
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === 'updatefound') {
          updateFoundHandler = handler;
        }
      }),
    };

    const registerMock = jest.fn().mockResolvedValue(registration);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: {},
        register: registerMock,
      },
    });

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    const result = await serviceWorker.registerServiceWorker();

    expect(result).toBe(registration);
    expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(registration.addEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function),
    );

    expect(updateFoundHandler).not.toBeNull();
    if (updateFoundHandler) {
      updateFoundHandler();
    }
    if (workerListeners.statechange) {
      workerListeners.statechange();
    }

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sw-update-available' }),
    );
  });

  it('returns null when service workers are not supported', async () => {
    const originalNavigator = window.navigator;
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: {} as Navigator,
    });

    const result = await serviceWorker.registerServiceWorker();

    expect(result).toBeNull();

    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });
});
