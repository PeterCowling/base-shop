import React from 'react';
import { fireEvent,render, screen } from '@testing-library/react';

import { Pagination } from './Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    pageSize: 20,
    totalItems: 200,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders pagination with correct items info', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('renders page navigation', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });

    it('renders first/last buttons when showFirstLast is true', () => {
      render(<Pagination {...defaultProps} showFirstLast />);

      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
    });

    it('does not render first/last buttons when showFirstLast is false', () => {
      render(<Pagination {...defaultProps} showFirstLast={false} />);

      expect(screen.queryByLabelText('Go to first page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Go to last page')).not.toBeInTheDocument();
    });

    it('renders page size selector when showPageSizeSelector is true', () => {
      const onPageSizeChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          showPageSizeSelector
          onPageSizeChange={onPageSizeChange}
        />
      );

      expect(screen.getByLabelText('Per page:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('does not render page size selector when showPageSizeSelector is false', () => {
      render(<Pagination {...defaultProps} showPageSizeSelector={false} />);

      expect(screen.queryByLabelText('Per page:')).not.toBeInTheDocument();
    });

    it('renders "No items" when totalItems is 0', () => {
      render(<Pagination {...defaultProps} totalItems={0} totalPages={0} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onPageChange when next button is clicked', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByLabelText('Go to next page'));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous button is clicked', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByLabelText('Go to previous page'));

      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('calls onPageChange with 1 when first button is clicked', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} showFirstLast />);

      fireEvent.click(screen.getByLabelText('Go to first page'));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with totalPages when last button is clicked', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} showFirstLast />);

      fireEvent.click(screen.getByLabelText('Go to last page'));

      expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('disables previous buttons on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} showFirstLast />);

      expect(screen.getByLabelText('Go to first page')).toBeDisabled();
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    });

    it('disables next buttons on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} showFirstLast />);

      expect(screen.getByLabelText('Go to next page')).toBeDisabled();
      expect(screen.getByLabelText('Go to last page')).toBeDisabled();
    });

    it('does not call onPageChange when disabled', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} disabled />);

      fireEvent.click(screen.getByLabelText('Go to next page'));

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Size Selector', () => {
    it('calls onPageSizeChange when page size is changed', () => {
      const onPageSizeChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          showPageSizeSelector
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50]}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '50' } });

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('renders custom page size options', () => {
      render(
        <Pagination
          {...defaultProps}
          showPageSizeSelector
          onPageSizeChange={jest.fn()}
          pageSizeOptions={[5, 15, 25]}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('5');
      expect(select).toHaveTextContent('15');
      expect(select).toHaveTextContent('25');
    });

    it('disables page size selector when disabled', () => {
      render(
        <Pagination
          {...defaultProps}
          showPageSizeSelector
          onPageSizeChange={jest.fn()}
          disabled
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Items Range', () => {
    it('calculates correct range for first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} pageSize={20} totalItems={200} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('calculates correct range for middle page', () => {
      render(<Pagination {...defaultProps} currentPage={5} pageSize={20} totalItems={200} />);

      expect(screen.getByText('81')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('calculates correct range for last page with partial items', () => {
      render(<Pagination {...defaultProps} currentPage={11} pageSize={20} totalItems={205} totalPages={11} />);

      expect(screen.getByText('201')).toBeInTheDocument();
      expect(screen.getByText('205')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has navigation role', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has aria-label on navigation', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
    });

    it('has proper aria-labels on buttons', () => {
      render(<Pagination {...defaultProps} showFirstLast />);

      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Pagination {...defaultProps} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
