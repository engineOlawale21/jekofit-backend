import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartItem } from '../entities/cart-item.entity';
import { Cart } from '../entities/cart.entity';
import { Design } from '../../design/entities/design.entity';

@Injectable()
export class CartService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Cart) private readonly carts: Repository<Cart>,
  ) {}

  async get(userId: string) {
    const cart = await this.carts.findOne({
      where: { userId },
      relations: { items: { productVariant: { product: true } } },
    });
    return this.toResponse(cart ?? { id: null, items: [] } as Cart);
  }

  async add(userId: string, input: AddCartItemDto) {
    await this.dataSource.transaction(async (manager) => {
      const variants = manager.getRepository(ProductVariant);
      const carts = manager.getRepository(Cart);
      const items = manager.getRepository(CartItem);
      const designs = manager.getRepository(Design);
      const variant = await variants.findOne({ where: { id: input.productVariantId, isActive: true }, lock: { mode: 'pessimistic_read' } });
      if (!variant) throw new NotFoundException('Product variant not found');
      if (variant.stockQuantity < input.quantity) throw new BadRequestException('Requested quantity is unavailable');

      let cart = await carts.findOne({ where: { userId } });
      if (!cart) cart = await carts.save(carts.create({ userId }));
      const design = input.designId ? await designs.findOne({ where: { id: input.designId, userId } }) : null;
      if (input.designId && !design) throw new NotFoundException('Design not found');
      const existing = input.designId
        ? await items.findOne({ where: { cartId: cart.id, productVariantId: variant.id, designId: input.designId } })
        : await items.createQueryBuilder('item')
          .where('item."cartId" = :cartId AND item."productVariantId" = :productVariantId AND item."designId" IS NULL', { cartId: cart.id, productVariantId: variant.id })
          .getOne();
      const quantity = (existing?.quantity ?? 0) + input.quantity;
      if (quantity > 20 || quantity > variant.stockQuantity) throw new BadRequestException('Requested quantity is unavailable');
      await items.save(existing ? { ...existing, quantity } : items.create({ cartId: cart.id, productVariantId: variant.id, quantity, designId: design?.id ?? null, designSnapshot: design ? { id: design.id, name: design.name, garmentColour: design.garmentColour, canvas: design.canvas } : null }));
    });
    return this.get(userId);
  }

  async update(userId: string, itemId: string, input: UpdateCartItemDto) {
    await this.dataSource.transaction(async (manager) => {
      const items = manager.getRepository(CartItem);
      const item = await items.createQueryBuilder('item')
        .innerJoin('item.cart', 'cart')
        .leftJoinAndSelect('item.productVariant', 'variant')
        .where('item.id = :itemId AND cart.userId = :userId', { itemId, userId })
        .getOne();
      if (!item) throw new NotFoundException('Cart item not found');
      if (!item.productVariant.isActive || item.productVariant.stockQuantity < input.quantity) throw new BadRequestException('Requested quantity is unavailable');
      await items.update(item.id, { quantity: input.quantity });
    });
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const result = await this.dataSource.createQueryBuilder()
      .delete()
      .from(CartItem)
      .where('id = :itemId AND "cartId" IN (SELECT id FROM carts WHERE "userId" = :userId)', { itemId, userId })
      .execute();
    if (!result.affected) throw new NotFoundException('Cart item not found');
    return this.get(userId);
  }

  private toResponse(cart: Cart) {
    const items = cart.items.map((item) => {
      const variant = item.productVariant;
      const unitPrice = Number(variant.price);
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: variant.product.id,
          name: variant.product.name,
          slug: variant.product.slug,
          imageUrl: variant.product.imageUrls[0] ?? null,
        },
        variant: { id: variant.id, sku: variant.sku, colour: variant.colour, size: variant.size, currency: variant.currency, unitPrice },
        designSnapshot: item.designSnapshot,
        lineTotal: unitPrice * item.quantity,
      };
    });
    return { id: cart.id, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0) };
  }
}
