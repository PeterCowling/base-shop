import React from 'react';
import { fireEvent,render, screen } from '@testing-library/react';
import { Download, Trash2 } from 'lucide-react';

import { BulkActions } from './BulkActions';

describe('BulkActions', () => {
  const mockActions = [
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      onClick: jest.fn(),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: jest.fn(),
      variant: 'danger' as const,
    },
  ];

  const defaultProps = {
    selectedCount: 5,
    actions: mockActions,
    onClearSelection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders selected count', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByText('5 items selected')).toBeInTheDocument();
    });

    it('renders singular text when one item selected', () => {
      render(<BulkActions {...defaultProps} selectedCount={1} />);

      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('renders total count when provided', () => {
      render(<BulkActions {...defaultProps} totalCount={100} />);

      expect(screen.getByText('5 items selected of 100')).toBeInTheDocument();
    });

    it('renders all action buttons', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('renders clear selection button', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('does not render when selectedCount is 0', () => {
      const { container } = render(<BulkActions {...defaultProps} selectedCount={0} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Actions', () => {
    it('calls action onClick when button clicked', () => {
      const onExport = jest.fn();
      const actions = [{ id: 'export', label: 'Export', onClick: onExport }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      fireEvent.click(screen.getByText('Export'));

      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('calls onClearSelection when clear button clicked', () => {
      const onClearSelection = jest.fn();
      render(<BulkActions {...defaultProps} onClearSelection={onClearSelection} />);

      fireEvent.click(screen.getByText('Clear'));

      expect(onClearSelection).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when action is disabled', () => {
      const onClick = jest.fn();
      const actions = [{ id: 'export', label: 'Export', onClick, disabled: true }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      fireEvent.click(screen.getByText('Export'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('renders disabled action with disabled styling', () => {
      const actions = [{ id: 'export', label: 'Export', onClick: jest.fn(), disabled: true }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      const button = screen.getByText('Export');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('renders default variant with blue styling', () => {
      const actions = [{ id: 'export', label: 'Export', onClick: jest.fn(), variant: 'default' as const }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      const button = screen.getByText('Export');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('renders danger variant with red styling', () => {
      const actions = [{ id: 'delete', label: 'Delete', onClick: jest.fn(), variant: 'danger' as const }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      const button = screen.getByText('Delete');
      expect(button).toHaveClass('bg-red-600');
    });

    it('defaults to default variant when variant not specified', () => {
      const actions = [{ id: 'export', label: 'Export', onClick: jest.fn() }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      const button = screen.getByText('Export');
      expect(button).toHaveClass('bg-blue-600');
    });
  });

  describe('Icons', () => {
    it('renders action icons when provided', () => {
      render(<BulkActions {...defaultProps} />);

      const exportButton = screen.getByText('Export').parentElement;
      const deleteButton = screen.getByText('Delete').parentElement;

      // Icons are rendered as svg elements with lucide classes
      expect(exportButton?.querySelector('svg')).toBeInTheDocument();
      expect(deleteButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders without icon when not provided', () => {
      const actions = [{ id: 'export', label: 'Export', onClick: jest.fn() }];

      render(<BulkActions {...defaultProps} actions={actions} />);

      const button = screen.getByText('Export').parentElement;
      expect(button?.querySelectorAll('svg')).toHaveLength(0);
    });
  });

  describe('Positioning', () => {
    it('applies no special classes for top position', () => {
      const { container } = render(<BulkActions {...defaultProps} position="top" />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).not.toHaveClass('sticky');
    });

    it('applies no special classes for bottom position', () => {
      const { container } = render(<BulkActions {...defaultProps} position="bottom" />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).not.toHaveClass('sticky');
    });

    it('applies sticky classes for sticky position', () => {
      const { container } = render(<BulkActions {...defaultProps} position="sticky" />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass('sticky');
      expect(toolbar).toHaveClass('top-0');
      expect(toolbar).toHaveClass('z-10');
    });

    it('defaults to top position', () => {
      const { container } = render(<BulkActions {...defaultProps} />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).not.toHaveClass('sticky');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<BulkActions {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has toolbar role', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('has aria-label on toolbar', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByLabelText('Bulk actions')).toBeInTheDocument();
    });

    it('has aria-label on clear button', () => {
      render(<BulkActions {...defaultProps} />);

      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });
  });
});
