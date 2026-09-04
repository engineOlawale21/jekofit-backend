import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
@Index(['sku'], { unique: true })
@Index(['productId', 'isActive'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ length: 80 })
  sku: string;

  @Column({ length: 48 })
  colour: string;

  @Column({ length: 24 })
  size: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: string;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ default: true })
  isActive: boolean;
}
