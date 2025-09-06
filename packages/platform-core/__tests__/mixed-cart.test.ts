/** @jest-environment node */

interface OrderItem {
  id: string;
  type: 'rental' | 'sale';
  status: 'pending' | 'shipped' | 'failed' | 'refunded';
}

interface Order {
  id: string;
  items: OrderItem[];
  status: 'pending' | 'partial' | 'shipped';
}

function buildOrder(items: OrderItem[]): Order {
  return { id: 'order1', items: [...items], status: 'pending' };
}

function applyShipmentUpdate(
  order: Order,
  updates: Array<{ id: string; status: OrderItem['status'] }>,
): Order {
  for (const update of updates) {
    const item = order.items.find((i) => i.id === update.id);
    if (item) item.status = update.status;
  }
  const shipped = order.items.filter((i) => i.status === 'shipped').length;
  const handled = order.items.filter((i) => i.status === 'shipped' || i.status === 'refunded').length;
  if (handled === order.items.length) {
    order.status = 'shipped';
  } else if (shipped > 0) {
    order.status = 'partial';
  } else {
    order.status = 'pending';
  }
  return order;
}

describe('mixed cart order shipment updates', () => {
  it('transitions from partial to shipped as all items ship', () => {
    const order = buildOrder([
      { id: 'rental1', type: 'rental', status: 'pending' },
      { id: 'sale1', type: 'sale', status: 'pending' },
    ]);

    applyShipmentUpdate(order, [{ id: 'rental1', status: 'shipped' }]);
    expect(order.status).toBe('partial');

    applyShipmentUpdate(order, [{ id: 'sale1', status: 'shipped' }]);
    expect(order.status).toBe('shipped');
  });

  it('remains partial when remaining items fail to ship', () => {
    const order = buildOrder([
      { id: 'rental1', type: 'rental', status: 'pending' },
      { id: 'sale1', type: 'sale', status: 'pending' },
    ]);

    applyShipmentUpdate(order, [{ id: 'rental1', status: 'shipped' }]);
    applyShipmentUpdate(order, [{ id: 'sale1', status: 'failed' }]);

    expect(order.status).toBe('partial');
  });

  it('reaches shipped when failed items are refunded', () => {
    const order = buildOrder([
      { id: 'rental1', type: 'rental', status: 'pending' },
      { id: 'sale1', type: 'sale', status: 'pending' },
    ]);

    applyShipmentUpdate(order, [{ id: 'rental1', status: 'shipped' }]);
    applyShipmentUpdate(order, [{ id: 'sale1', status: 'failed' }]);
    expect(order.status).toBe('partial');

    applyShipmentUpdate(order, [{ id: 'sale1', status: 'refunded' }]);
    expect(order.status).toBe('shipped');
  });
});

