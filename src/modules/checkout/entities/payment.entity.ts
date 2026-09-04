import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { CheckoutSession } from './checkout-session.entity';

export enum PaymentStatus { Initialized = 'initialized', Paid = 'paid', Failed = 'failed' }

@Entity('payments')
@Index(['provider', 'providerReference'], { unique: true })
@Index(['checkoutSessionId'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  checkoutSessionId: string;

  @ManyToOne(() => CheckoutSession, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checkoutSessionId' })
  checkoutSession: CheckoutSession;

  @Column({ length: 32 })
  provider: string;

  @Column({ length: 128 })
  providerReference: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Initialized })
  status: PaymentStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  providerTransactionId: string | null;

  @Column('uuid', { nullable: true, unique: true })
  orderId: string | null;

  @OneToOne(() => Order, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
