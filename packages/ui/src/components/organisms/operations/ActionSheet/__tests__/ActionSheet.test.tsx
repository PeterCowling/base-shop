import { render, screen, fireEvent } from '@testing-library/react';
import { ActionSheet } from '../ActionSheet';

describe('ActionSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Action Sheet',
    description: 'Test description',
    children: <div>Sheet content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ActionSheet {...defaultProps} />);

    expect(screen.getByText('Test Action Sheet')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ActionSheet {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Action Sheet')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ActionSheet {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked and closeOnBackdropClick is true', () => {
    render(<ActionSheet {...defaultProps} closeOnBackdropClick={true} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when backdrop is clicked and closeOnBackdropClick is false', () => {
    render(<ActionSheet {...defaultProps} closeOnBackdropClick={false} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when content is clicked', () => {
    render(<ActionSheet {...defaultProps} />);

    const content = screen.getByText('Sheet content');
    fireEvent.click(content);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed and closeOnEscape is true', () => {
    render(<ActionSheet {...defaultProps} closeOnEscape={true} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape key is pressed and closeOnEscape is false', () => {
    render(<ActionSheet {...defaultProps} closeOnEscape={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders with aria attributes for accessibility', () => {
    render(<ActionSheet {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'action-sheet-title');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ActionSheet {...defaultProps} className="custom-class" />
    );

    const sheet = container.querySelector('.custom-class');
    expect(sheet).toBeInTheDocument();
  });
});
