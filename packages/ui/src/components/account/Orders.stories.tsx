import type { Meta, StoryObj } from '@storybook/react';
import { OrderTrackingTimeline, type OrderStep } from '../organisms/OrderTrackingTimeline';

function OrdersDemo() {
  const shipping: OrderStep[] = [
    { label: 'Order placed', date: '2025-01-01', complete: true },
    { label: 'Shipped', date: '2025-01-02', complete: true },
    { label: 'Out for delivery', complete: false },
  ];
  const returns: OrderStep[] = [
    { label: 'Return initiated', complete: false },
  ];
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl">Orders</h1>
      <ul className="space-y-2">
        <li className="rounded border p-4">
          <div>Order: 1001</div>
          <OrderTrackingTimeline shippingSteps={shipping} returnSteps={returns} className="mt-2" />
          <p className="mt-2 text-sm">Status: In transit</p>
        </li>
        <li className="rounded border p-4">
          <div>Order: 1002</div>
          <p className="mt-2 text-sm">No tracking available</p>
        </li>
      </ul>
    </div>
  );
}

const meta = {
  title: 'Account/Orders (Demo)',
  component: OrdersDemo,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Demo composition illustrating the Orders page UI with the OrderTrackingTimeline component. The real page is server-rendered and requires auth.' } },
  },
} satisfies Meta<typeof OrdersDemo>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

