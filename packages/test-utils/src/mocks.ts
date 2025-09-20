import type { Session } from 'next-auth';

export const adminSession = {
  user: { role: 'admin', email: 'admin@example.com' },
} as unknown as Session;

/** Mock next-auth to always resolve an admin session */
export function mockNextAuthAdmin(): void {
  const { __setMockSession } = require('next-auth') as {
    __setMockSession: (s: Session | null) => void;
  };
  __setMockSession(adminSession);
}

/** Common mock used by CMS routes to avoid sending emails during tests */
export function mockSessionAndEmail(): void {
  mockNextAuthAdmin();
  jest.doMock('@acme/email', () => ({ sendEmail: jest.fn() }));
}
