import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Package } from 'lucide-react';

describe('EmptyState', () => {
  const defaultProps = {
    title: 'No Items',
    description: 'Get started by adding an item',
  };

  it('renders title and description', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByText('No Items')).toBeInTheDocument();
    expect(screen.getByText('Get started by adding an item')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <EmptyState {...defaultProps} icon={Package} />
    );

    // Check for SVG element (lucide icons render as SVG)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(<EmptyState {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const onClickMock = jest.fn();

    render(
      <EmptyState
        {...defaultProps}
        actions={[
          {
            label: 'Add Item',
            onClick: onClickMock,
            variant: 'primary',
          },
          {
            label: 'Import',
            onClick: onClickMock,
            variant: 'secondary',
          },
        ]}
      />
    );

    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('calls onClick when action button is clicked', () => {
    const onClickMock = jest.fn();

    render(
      <EmptyState
        {...defaultProps}
        actions={[
          {
            label: 'Add Item',
            onClick: onClickMock,
          },
        ]}
      />
    );

    const button = screen.getByText('Add Item');
    fireEvent.click(button);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders custom children content', () => {
    render(
      <EmptyState {...defaultProps}>
        <div>Custom content</div>
      </EmptyState>
    );

    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with sm size', () => {
    const { container } = render(
      <EmptyState {...defaultProps} size="sm" />
    );

    expect(container.firstChild).toHaveClass('py-8');
  });

  it('renders with default size', () => {
    const { container } = render(
      <EmptyState {...defaultProps} size="default" />
    );

    expect(container.firstChild).toHaveClass('py-12');
  });

  it('renders with lg size', () => {
    const { container } = render(
      <EmptyState {...defaultProps} size="lg" />
    );

    expect(container.firstChild).toHaveClass('py-16');
  });

  it('renders action with icon', () => {
    const { container } = render(
      <EmptyState
        {...defaultProps}
        actions={[
          {
            label: 'Add Item',
            onClick: jest.fn(),
            icon: Package,
          },
        ]}
      />
    );

    const button = screen.getByText('Add Item');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders multiple actions', () => {
    render(
      <EmptyState
        {...defaultProps}
        actions={[
          { label: 'Action 1', onClick: jest.fn() },
          { label: 'Action 2', onClick: jest.fn() },
          { label: 'Action 3', onClick: jest.fn() },
        ]}
      />
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Action 3')).toBeInTheDocument();
  });
});
