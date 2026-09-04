import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PendingPayment = 'pending_payment',
  Paid = 'paid',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

@Entity('orders')
@Index(['orderNumber'], { unique: true })
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32 })
  orderNumber: string;

  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => Auth, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PendingPayment })
  status: OrderStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: '0' })
  taxTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: '0' })
  shippingTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  grandTotal: string;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'jsonb' })
  shippingAddress: Record<string, string>;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
