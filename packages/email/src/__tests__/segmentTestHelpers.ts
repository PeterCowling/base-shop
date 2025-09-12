
export const emptySegments = '[]';
export const vipsSegment = JSON.stringify([{ id: 'vips', filters: [] }]);

export const setupSegmentTest = () => {
  jest.resetModules();
  jest.clearAllMocks();

  const mockListEvents = jest.fn();
  const mockStat = jest.fn();
  const mockReadFile = jest.fn();
  const validateShopName = jest.fn((s: string) => s);

  jest.doMock('@platform-core/repositories/analytics.server', () => ({
    listEvents: (...args: unknown[]) => mockListEvents(...args),
  }));

  jest.doMock('fs', () => ({
    ...jest.requireActual('node:fs'),
    promises: {
      readFile: (...args: unknown[]) => mockReadFile(...args),
      stat: (...args: unknown[]) => mockStat(...args),
    },
  }));

  jest.doMock('@acme/lib', () => ({
    validateShopName,
  }));

  jest.doMock('../providers/sendgrid', () => ({
    SendgridProvider: class {},
  }));

  jest.doMock('../providers/resend', () => ({
    ResendProvider: class {},
  }));

  return { mockListEvents, mockStat, mockReadFile, validateShopName };
};
