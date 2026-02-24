import { fireEvent, render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';

import { MetricsCard } from '../MetricsCard';

describe('MetricsCard', () => {
  it('applies semantic token classes for default variant', () => {
    const { container } = render(<MetricsCard label="Revenue" value="€120" />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-surface-2', 'border-border-2');
    expect(screen.getByText('Revenue')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('€120')).toHaveClass('text-foreground');
  });

  it('applies semantic token classes for status variants and icon tone', () => {
    const { container } = render(
      <MetricsCard
        label="Active Users"
        value="42"
        variant="success"
        icon={Activity}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-success-soft', 'border-success/40');

    const iconWrapper = container.querySelector('.text-success-foreground');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('uses semantic trend foreground tokens', () => {
    const { rerender } = render(
      <MetricsCard
        label="Trend"
        value="10%"
        trend={{ value: 4.2, direction: 'up' }}
      />
    );

    expect(screen.getByText('+4.2%').parentElement).toHaveClass(
      'text-success-foreground'
    );

    rerender(
      <MetricsCard
        label="Trend"
        value="10%"
        trend={{ value: -3.1, direction: 'down' }}
      />
    );

    expect(screen.getByText('-3.1%').parentElement).toHaveClass(
      'text-danger-foreground'
    );
  });

  it('supports keyboard activation for interactive cards', () => {
    const onClick = jest.fn();

    render(<MetricsCard label="Interactive" value="1" onClick={onClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
