import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';
import { Payment } from './payment.entity';

export enum CheckoutSessionStatus {
  Open = 'open',
  PaymentPending = 'payment_pending',
  Completed = 'completed',
  Expired = 'expired',
}

@Entity('checkout_sessions')
@Index(['userId', 'status', 'updatedAt'])
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Column({ type: 'enum', enum: CheckoutSessionStatus, default: CheckoutSessionStatus.Open })
  status: CheckoutSessionStatus;

  @Column({ type: 'jsonb' })
  cartSnapshot: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: '0' })
  taxTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: '0' })
  shippingTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: '0' })
  grandTotal: string;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: Record<string, string> | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  shippingMethod: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
