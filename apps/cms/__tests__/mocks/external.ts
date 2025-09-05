/**
 * Reusable Jest mocks for external dependencies used across CMS tests.
 * Mocking these modules avoids network and database calls during test runs.
 */

export const prismaMock = {
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  })),
};
jest.mock("@prisma/client", () => prismaMock);

export const redisMock = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));
jest.mock("ioredis", () => redisMock, { virtual: true });

export const nodemailerMock = {
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(undefined),
  })),
};
jest.mock("nodemailer", () => nodemailerMock);

export const sendGridMock = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue({}),
};
jest.mock("@sendgrid/mail", () => sendGridMock, { virtual: true });

export const resendMock = {
  Resend: jest.fn(() => ({
    emails: { send: jest.fn().mockResolvedValue({}) },
  })),
};
jest.mock("resend", () => resendMock, { virtual: true });

export const sanitizeHtmlMock = jest.fn((input: string) => input);
jest.mock("sanitize-html", () => sanitizeHtmlMock);

export const nextHeadersMock = {
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
};
jest.mock("next/headers", () => nextHeadersMock);

export const nextCookiesMock = {
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
};
jest.mock("next/cookies", () => nextCookiesMock, { virtual: true });

// Re-export a helper to make it easy for tests to reset mocks when needed.
export function resetExternalMocks() {
  prismaMock.PrismaClient.mockClear();
  redisMock.mockClear();
  nodemailerMock.createTransport.mockClear();
  sendGridMock.setApiKey.mockClear();
  sendGridMock.send.mockClear();
  resendMock.Resend.mockClear();
  sanitizeHtmlMock.mockClear();
  nextHeadersMock.headers.mockClear();
  nextHeadersMock.cookies.mockClear();
  nextCookiesMock.cookies.mockClear();
}
