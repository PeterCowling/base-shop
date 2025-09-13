const releaseMock = jest.fn();

jest.mock('@acme/platform-machine', () => ({
  releaseDepositsOnce: (...args: any[]) => releaseMock(...args),
}));

describe('scripts/release-deposits', () => {
  beforeEach(() => {
    jest.resetModules();
    releaseMock.mockReset();
    process.exit = jest.fn() as any;
  });

  it('calls releaseDepositsOnce', async () => {
    releaseMock.mockResolvedValue(undefined);
    await import('../../../scripts/src/release-deposits');
    await new Promise(process.nextTick);
    expect(releaseMock).toHaveBeenCalled();
  });
});
