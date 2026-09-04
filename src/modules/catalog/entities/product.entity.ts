import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
@Index(['slug'], { unique: true })
@Index(['category', 'isPublished'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 180 })
  slug: string;

  @Column({ length: 48, unique: true, nullable: true })
  legacyId: string | null;

  @Column({ length: 64 })
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  imageUrls: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ default: false })
  isPublished: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
