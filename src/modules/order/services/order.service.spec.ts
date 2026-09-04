import { NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';

describe('OrderService reorder', () => {
  const orders = { findOne: jest.fn(), findAndCount: jest.fn() };
  const cart = { addMany: jest.fn() };
  const service = new OrderService(orders as any, cart as any);

  beforeEach(() => jest.clearAllMocks());

  it('repopulates the cart with available standard order items', async () => {
    orders.findOne.mockResolvedValue({
      orderNumber: 'JKO-1',
      items: [
        { productVariantId: 'variant-1', quantity: 2, designSnapshot: null },
        { productVariantId: 'variant-2', quantity: 1, designSnapshot: { canvas: {} } },
      ],
    });
    cart.addMany.mockResolvedValue({ itemCount: 2 });
    await expect(service.reorder('user-1', 'JKO-1')).resolves.toEqual({
      sourceOrderNumber: 'JKO-1', cart: { itemCount: 2 }, skippedCustomItems: 1,
    });
    expect(cart.addMany).toHaveBeenCalledWith('user-1', [{ productVariantId: 'variant-1', quantity: 2 }]);
  });

  it('does not expose or reorder another user’s order', async () => {
    orders.findOne.mockResolvedValue(null);
    await expect(service.reorder('user-1', 'JKO-2')).rejects.toBeInstanceOf(NotFoundException);
    expect(cart.addMany).not.toHaveBeenCalled();
  });
});
