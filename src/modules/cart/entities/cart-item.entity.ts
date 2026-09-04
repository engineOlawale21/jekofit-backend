import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';
import { Cart } from './cart.entity';

@Entity('cart_items')
@Unique(['cartId', 'productVariantId', 'designId'])
@Check('"quantity" > 0')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Index()
  @Column('uuid')
  productVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant;

  @Column('uuid', { nullable: true })
  designId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  designSnapshot: Record<string, unknown> | null;

  @Column({ type: 'int' })
  quantity: number;
}
