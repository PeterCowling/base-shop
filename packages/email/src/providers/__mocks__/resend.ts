export const send = jest.fn();

export const Resend = jest.fn().mockImplementation(() => ({
  emails: { send },
}));
