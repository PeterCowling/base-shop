import { render, screen } from '@testing-library/react';

import { ServiceCard } from '../ServiceCard';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ServiceCard DS Migration', () => {
  const defaultProps = {
    title: 'Room Service',
    to: '/services/room-service',
    description: 'Order food to your room',
    image: '/img/room-service.jpg',
    alt: 'Room service image',
  };

  // TC-01: ServiceCard renders with Card primitive → card structure uses DS tokens
  it('should render with DS Card component and theme token classes', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    // Card component adds data-token attribute
    expect(card.getAttribute('data-token')).toBe('--color-bg');
    // Should NOT have raw gray/white palette classes
    expect(card.className).not.toMatch(/\bbg-white\b/);
    expect(card.className).not.toMatch(/\bborder-gray-/);
  });

  // TC-02: ServiceCard renders title link with theme token color
  it('should render title link with theme token color classes', () => {
    render(<ServiceCard {...defaultProps} />);
    const link = screen.getByRole('link', { name: defaultProps.title });
    expect(link).toBeTruthy();
    // Should NOT have raw blue palette classes
    expect(link.className).not.toMatch(/\btext-blue-/);
  });

  // TC-03: ServiceCard renders description with theme token color
  it('should render description with theme token text color', () => {
    render(<ServiceCard {...defaultProps} />);
    const description = screen.getByText(defaultProps.description);
    expect(description).toBeTruthy();
    // Should NOT have raw gray palette
    expect(description.className).not.toMatch(/\btext-gray-/);
  });

  // TC-04: ServiceCard renders image when provided
  it('should render image with correct alt text', () => {
    render(<ServiceCard {...defaultProps} />);
    const img = screen.getByAltText(defaultProps.alt);
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(defaultProps.image);
  });

  // TC-05: ServiceCard omits image when not provided
  it('should not render image when image prop is omitted', () => {
    const { title, to, description } = defaultProps;
    render(<ServiceCard title={title} to={to} description={description} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
