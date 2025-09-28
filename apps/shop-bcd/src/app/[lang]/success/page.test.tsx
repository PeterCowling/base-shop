import { render, screen } from '@testing-library/react';
import Success from './page';

describe('Success page (localized)', () => {
  it('renders thank-you heading and receipt message', () => {
    render(<Success params={{ lang: 'en' }} /> as any);
    expect(
      screen.getByRole('heading', {
        name: /Thanks for your order!/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Check your e-mail for the receipt./i)
    ).toBeInTheDocument();
  });
});
