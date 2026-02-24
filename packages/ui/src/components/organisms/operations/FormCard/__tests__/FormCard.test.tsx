import { render, screen } from '@testing-library/react';

import { FormCard } from '../FormCard';

describe('FormCard', () => {
  const defaultProps = {
    title: 'Test Form',
    description: 'Test description',
    children: <div>Form content</div>,
  };

  it('renders title and description', () => {
    render(<FormCard {...defaultProps} />);

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<FormCard {...defaultProps} />);

    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <FormCard {...defaultProps} footer={<button>Submit</button>} />
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('shows success message when state is success', () => {
    const { container } = render(
      <FormCard
        {...defaultProps}
        state="success"
        successMessage="Operation successful!"
      />
    );

    const message = screen.getByText('Operation successful!');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-success-foreground');
    expect(message.parentElement?.parentElement).toHaveClass(
      'border-success/40',
      'bg-success-soft'
    );
    expect(
      container.querySelector('svg.h-5.w-5.text-success-foreground')
    ).toBeInTheDocument();
  });

  it('shows error message when state is error', () => {
    const { container } = render(
      <FormCard
        {...defaultProps}
        state="error"
        errorMessage="Operation failed!"
      />
    );

    const message = screen.getByText('Operation failed!');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-danger-foreground');
    expect(message.parentElement?.parentElement).toHaveClass(
      'border-danger/40',
      'bg-danger-soft'
    );
    expect(
      container.querySelector('svg.h-5.w-5.text-danger-foreground')
    ).toBeInTheDocument();
  });

  it('shows loading overlay when showLoadingOverlay is true and state is loading', () => {
    render(
      <FormCard
        {...defaultProps}
        state="loading"
        showLoadingOverlay={true}
      />
    );

    expect(screen.getByText('Saving changes...')).toBeInTheDocument();
  });

  it('does not show loading overlay when showLoadingOverlay is false', () => {
    render(
      <FormCard
        {...defaultProps}
        state="loading"
        showLoadingOverlay={false}
      />
    );

    expect(screen.queryByText('Saving changes...')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormCard {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses semantic token classes for shell and sections', () => {
    const { container } = render(
      <FormCard {...defaultProps} footer={<button>Submit</button>} />
    );

    const shell = container.firstChild as HTMLElement;
    const heading = screen.getByRole('heading', { name: 'Test Form' });
    const header = heading.parentElement as HTMLElement;
    const footer = screen.getByText('Submit').closest('div.border-t');

    expect(shell).toHaveClass(
      'overflow-hidden',
      'rounded-lg',
      'border-border-2',
      'bg-surface-2'
    );
    expect(header).toHaveClass('border-border-2', 'bg-surface-1');
    expect(screen.getByText('Test description')).toHaveClass(
      'text-muted-foreground'
    );
    expect(footer).toHaveClass('border-border-2', 'bg-surface-1');
  });

  it('does not show success message when state is not success', () => {
    render(
      <FormCard
        {...defaultProps}
        state="idle"
        successMessage="Success!"
      />
    );

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('does not show error message when state is not error', () => {
    render(
      <FormCard
        {...defaultProps}
        state="idle"
        errorMessage="Error!"
      />
    );

    expect(screen.queryByText('Error!')).not.toBeInTheDocument();
  });
});
