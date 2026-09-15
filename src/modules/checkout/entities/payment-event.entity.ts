import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Payment } from './payment.entity';

export enum PaymentEventType {
  Initialized = 'initialized',
  WebhookReceived = 'webhook_received',
  VerificationSucceeded = 'verification_succeeded',
  VerificationFailed = 'verification_failed',
  Finalized = 'finalized',
}

@Entity('payment_events')
@Index(['paymentId', 'createdAt'])
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') paymentId: string;
  @ManyToOne(() => Payment, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'paymentId' }) payment: Payment;
  @Column({ type: 'enum', enum: PaymentEventType }) type: PaymentEventType;
  @Column({ type: 'jsonb', default: () => "'{}'" }) details: Record<string, string | number | boolean | null>;
  @CreateDateColumn() createdAt: Date;
}
