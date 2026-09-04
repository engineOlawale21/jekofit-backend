import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';
import { Product } from '../../catalog/entities/product.entity';

@Entity('product_favourites')
@Unique(['userId', 'productId'])
@Index(['userId', 'createdAt'])
export class ProductFavourite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Index()
  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
