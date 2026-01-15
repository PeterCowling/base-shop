import React from 'react';
import { render, screen } from '@testing-library/react';
import { Package, CheckCircle } from 'lucide-react';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  const mockEvents = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      title: 'Order created',
      description: 'New order #1234',
      icon: Package,
      iconColor: 'blue' as const,
      user: 'John Doe',
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T11:00:00'),
      title: 'Order shipped',
      description: 'Order shipped via FedEx',
      icon: CheckCircle,
      iconColor: 'green' as const,
      user: 'Jane Smith',
    },
  ];

  describe('Rendering', () => {
    it('renders all events', () => {
      render(<Timeline events={mockEvents} />);

      expect(screen.getByText('Order created')).toBeInTheDocument();
      expect(screen.getByText('Order shipped')).toBeInTheDocument();
    });

    it('renders event descriptions', () => {
      render(<Timeline events={mockEvents} />);

      expect(screen.getByText('New order #1234')).toBeInTheDocument();
      expect(screen.getByText('Order shipped via FedEx')).toBeInTheDocument();
    });

    it('renders user attribution', () => {
      render(<Timeline events={mockEvents} />);

      expect(screen.getByText('by John Doe')).toBeInTheDocument();
      expect(screen.getByText('by Jane Smith')).toBeInTheDocument();
    });

    it('renders event icons', () => {
      const { container } = render(<Timeline events={mockEvents} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders empty state when no events', () => {
      render(<Timeline events={[]} />);

      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      render(<Timeline events={[]} emptyMessage="No activity to display" />);

      expect(screen.getByText('No activity to display')).toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('shows time by default', () => {
      render(<Timeline events={mockEvents} />);

      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    });

    it('hides time when showTime is false', () => {
      render(<Timeline events={mockEvents} showTime={false} />);

      expect(screen.queryByText('10:30 AM')).not.toBeInTheDocument();
    });

    it('shows date when showDate is true', () => {
      render(<Timeline events={mockEvents} showDate />);

      expect(screen.getAllByText(/Jan 15, 2024/)).toHaveLength(2);
    });

    it('does not show date by default', () => {
      render(<Timeline events={mockEvents} />);

      expect(screen.queryByText(/Jan 15, 2024/)).not.toBeInTheDocument();
    });

    it('shows both date and time when both enabled', () => {
      render(<Timeline events={mockEvents} showDate showTime />);

      expect(screen.getAllByText(/Jan 15, 2024/)).toHaveLength(2);
      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    });
  });

  describe('Icon Colors', () => {
    it('applies blue color class', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          icon: Package,
          iconColor: 'blue' as const,
        },
      ];
      const { container } = render(<Timeline events={events} />);

      const iconContainer = container.querySelector('.bg-blue-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies green color class', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          icon: CheckCircle,
          iconColor: 'green' as const,
        },
      ];
      const { container } = render(<Timeline events={events} />);

      const iconContainer = container.querySelector('.bg-green-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies red color class', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          icon: Package,
          iconColor: 'red' as const,
        },
      ];
      const { container } = render(<Timeline events={events} />);

      const iconContainer = container.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies yellow color class', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          icon: Package,
          iconColor: 'yellow' as const,
        },
      ];
      const { container } = render(<Timeline events={events} />);

      const iconContainer = container.querySelector('.bg-yellow-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('defaults to gray when color not specified', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          icon: Package,
        },
      ];
      const { container } = render(<Timeline events={events} />);

      const iconContainer = container.querySelector('.bg-slate-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('renders without description', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
        },
      ];
      render(<Timeline events={events} />);

      expect(screen.getByText('Event')).toBeInTheDocument();
    });

    it('renders without user', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          description: 'Description',
        },
      ];
      render(<Timeline events={events} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.queryByText(/by/)).not.toBeInTheDocument();
    });

    it('renders without icon', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
        },
      ];
      const { container } = render(<Timeline events={events} />);

      // Icon container still rendered, just empty
      const iconContainer = container.querySelector('.bg-slate-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders custom metadata', () => {
      const events = [
        {
          id: '1',
          timestamp: new Date(),
          title: 'Event',
          metadata: <div data-testid="custom-metadata">Custom content</div>,
        },
      ];
      render(<Timeline events={events} />);

      expect(screen.getByTestId('custom-metadata')).toBeInTheDocument();
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('String Timestamps', () => {
    it('handles string timestamps', () => {
      const events = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00',
          title: 'Event',
        },
      ];
      render(<Timeline events={events} />);

      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Timeline events={mockEvents} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
