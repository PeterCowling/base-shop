import { render, screen } from '@testing-library/react';

import { TaskCard } from '../TaskCard';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TaskCard DS Migration', () => {
  const incompleteProps = {
    title: 'Pack your bags',
    note: 'Check the weather forecast',
    image: '/img/pack.jpg',
    alt: 'Packing image',
    link: '/tasks/pack',
    completed: false,
  };

  // TC-01: TaskCard incomplete state renders with DS Card and theme tokens
  it('should render incomplete state with DS Card component and theme tokens', () => {
    const { container } = render(<TaskCard {...incompleteProps} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    // Card component adds data-token attribute
    expect(card.getAttribute('data-token')).toBe('--color-bg');
    // Should NOT have raw gray/white palette classes
    expect(card.className).not.toMatch(/\bbg-white\b/);
    expect(card.className).not.toMatch(/\bborder-gray-/);
  });

  // TC-02: TaskCard incomplete state renders title link with theme tokens
  it('should render incomplete title link with theme token colors', () => {
    render(<TaskCard {...incompleteProps} />);
    const link = screen.getByRole('link', { name: incompleteProps.title });
    expect(link).toBeTruthy();
    expect(link.className).not.toMatch(/\btext-blue-/);
  });

  // TC-03: TaskCard completed state renders with theme tokens
  it('should render completed state with theme token success color', () => {
    const { container } = render(
      <TaskCard
        title="Pack your bags"
        completedTitle="Bags packed!"
        completed={true}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    // Should NOT have raw green/gray palette classes
    expect(card.className).not.toMatch(/\bborder-gray-/);
    // Check completed title is displayed
    expect(screen.getByText('Bags packed!')).toBeTruthy();
  });

  // TC-04: TaskCard completed state shows checkmark with theme success color
  it('should render checkmark icon with theme token success color', () => {
    const { container } = render(
      <TaskCard title="Pack" completed={true} />,
    );
    // Find the span wrapping the check icon
    const iconSpan = container.querySelector('span');
    expect(iconSpan).toBeTruthy();
    // Should NOT have raw green palette classes
    expect(iconSpan!.className).not.toMatch(/\btext-green-/);
  });

  // TC-05: TaskCard renders without link in incomplete state
  it('should render title as plain text when no link provided', () => {
    render(
      <TaskCard title="Pack your bags" note="Remember sunscreen" />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Pack your bags')).toBeTruthy();
  });
});
