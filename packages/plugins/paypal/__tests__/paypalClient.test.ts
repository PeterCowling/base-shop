import { processPaypalPayment } from '../paypalClient';

describe('processPaypalPayment', () => {
  it('resolves successfully for valid payload', async () => {
    await expect(processPaypalPayment({ amount: 100 } as any)).resolves.toEqual({ success: true });
  });

  it('resolves successfully for minimal payload', async () => {
    await expect(processPaypalPayment({} as any)).resolves.toEqual({ success: true });
  });
});
