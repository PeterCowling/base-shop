import React from 'react';
import { fireEvent,render, screen } from '@testing-library/react';

import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const mockSections = [
    {
      id: 'status',
      title: 'Status',
      children: <div>Status filters</div>,
      defaultExpanded: true,
    },
    {
      id: 'date',
      title: 'Date Range',
      children: <div>Date range picker</div>,
      defaultExpanded: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter panel with title', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders all sections', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('renders expanded sections by default', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.getByText('Status filters')).toBeInTheDocument();
    });

    it('does not render collapsed sections', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.queryByText('Date range picker')).not.toBeInTheDocument();
    });

    it('renders active filters count badge when count > 0', () => {
      render(<FilterPanel sections={mockSections} activeFiltersCount={3} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not render count badge when count is 0', () => {
      render(<FilterPanel sections={mockSections} activeFiltersCount={0} />);

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('renders clear button when showClearButton is true and filters are active', () => {
      render(<FilterPanel sections={mockSections} showClearButton activeFiltersCount={2} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('does not render clear button when no active filters', () => {
      render(<FilterPanel sections={mockSections} showClearButton activeFiltersCount={0} />);

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('does not render clear button when showClearButton is false', () => {
      render(<FilterPanel sections={mockSections} showClearButton={false} activeFiltersCount={2} />);

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('renders apply button when showApplyButton is true', () => {
      render(<FilterPanel sections={mockSections} showApplyButton onApply={jest.fn()} />);

      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    it('does not render apply button when showApplyButton is false', () => {
      render(<FilterPanel sections={mockSections} showApplyButton={false} />);

      expect(screen.queryByText('Apply Filters')).not.toBeInTheDocument();
    });
  });

  describe('Section Expansion', () => {
    it('expands collapsed section when clicked', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.queryByText('Date range picker')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Date Range'));

      expect(screen.getByText('Date range picker')).toBeInTheDocument();
    });

    it('collapses expanded section when clicked', () => {
      render(<FilterPanel sections={mockSections} />);

      expect(screen.getByText('Status filters')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Status'));

      expect(screen.queryByText('Status filters')).not.toBeInTheDocument();
    });

    it('maintains other sections state when toggling one section', () => {
      render(<FilterPanel sections={mockSections} />);

      fireEvent.click(screen.getByText('Date Range'));

      expect(screen.getByText('Status filters')).toBeInTheDocument();
      expect(screen.getByText('Date range picker')).toBeInTheDocument();
    });
  });

  describe('Panel Collapse', () => {
    it('collapses panel when isCollapsible is true and collapse button clicked', () => {
      render(<FilterPanel sections={mockSections} isCollapsible />);

      expect(screen.getByText('Status filters')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Collapse filters'));

      expect(screen.queryByText('Status filters')).not.toBeInTheDocument();
    });

    it('expands panel when collapsed and expand button clicked', () => {
      render(<FilterPanel sections={mockSections} isCollapsible />);

      fireEvent.click(screen.getByLabelText('Collapse filters'));
      fireEvent.click(screen.getByLabelText('Expand filters'));

      expect(screen.getByText('Status filters')).toBeInTheDocument();
    });

    it('does not render collapse button when isCollapsible is false', () => {
      render(<FilterPanel sections={mockSections} isCollapsible={false} />);

      expect(screen.queryByLabelText('Collapse filters')).not.toBeInTheDocument();
    });

    it('renders collapsed by default when defaultCollapsed is true', () => {
      render(<FilterPanel sections={mockSections} isCollapsible defaultCollapsed />);

      expect(screen.queryByText('Status filters')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onClear when clear button is clicked', () => {
      const onClear = jest.fn();
      render(
        <FilterPanel
          sections={mockSections}
          onClear={onClear}
          showClearButton
          activeFiltersCount={2}
        />
      );

      fireEvent.click(screen.getByText('Clear'));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('calls onApply when apply button is clicked', () => {
      const onApply = jest.fn();
      render(<FilterPanel sections={mockSections} onApply={onApply} showApplyButton />);

      fireEvent.click(screen.getByText('Apply Filters'));

      expect(onApply).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<FilterPanel sections={mockSections} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label on collapse button', () => {
      render(<FilterPanel sections={mockSections} isCollapsible />);

      expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument();
    });

    it('updates aria-label when panel is collapsed', () => {
      render(<FilterPanel sections={mockSections} isCollapsible />);

      fireEvent.click(screen.getByLabelText('Collapse filters'));

      expect(screen.getByLabelText('Expand filters')).toBeInTheDocument();
    });
  });
});
