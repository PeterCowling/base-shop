import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Operations/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// Interactive wrapper component
function PaginationDemo(props: Partial<typeof Pagination.arguments>) {
  const [currentPage, setCurrentPage] = useState(props.currentPage || 1);
  const [pageSize, setPageSize] = useState(props.pageSize || 20);

  const totalPages = Math.ceil((props.totalItems || 200) / pageSize);

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={props.totalItems || 200}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <PaginationDemo />,
};

export const WithPageSizeSelector: Story = {
  render: () => <PaginationDemo showPageSizeSelector />,
};

export const WithoutFirstLast: Story = {
  render: () => <PaginationDemo showFirstLast={false} />,
};

export const SmallDataset: Story = {
  render: () => <PaginationDemo totalItems={45} pageSize={10} />,
};

export const LargeDataset: Story = {
  render: () => <PaginationDemo totalItems={10000} pageSize={50} showPageSizeSelector />,
};

export const CustomPageSizes: Story = {
  render: () => (
    <PaginationDemo
      showPageSizeSelector
      pageSizeOptions={[5, 10, 25, 50, 100]}
      pageSize={25}
      totalItems={500}
    />
  ),
};

export const EmptyState: Story = {
  args: {
    currentPage: 1,
    totalPages: 0,
    pageSize: 20,
    totalItems: 0,
    onPageChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    pageSize: 20,
    totalItems: 200,
    onPageChange: () => {},
    disabled: true,
    showPageSizeSelector: true,
    onPageSizeChange: () => {},
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-8">
      <PaginationDemo showPageSizeSelector />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
