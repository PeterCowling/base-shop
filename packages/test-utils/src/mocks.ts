/** Mock next-auth to always resolve an admin session */
export function mockNextAuthAdmin(): void {
  jest.doMock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { role: 'admin' } }),
  }));
}

/** Common mock used by CMS routes to avoid sending emails during tests */
export function mockSessionAndEmail(): void {
  mockNextAuthAdmin();
  jest.doMock('@acme/email', () => ({ sendEmail: jest.fn() }));
}
