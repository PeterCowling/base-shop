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
    render(
      <FormCard
        {...defaultProps}
        state="success"
        successMessage="Operation successful!"
      />
    );

    expect(screen.getByText('Operation successful!')).toBeInTheDocument();
  });

  it('shows error message when state is error', () => {
    render(
      <FormCard
        {...defaultProps}
        state="error"
        errorMessage="Operation failed!"
      />
    );

    expect(screen.getByText('Operation failed!')).toBeInTheDocument();
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
