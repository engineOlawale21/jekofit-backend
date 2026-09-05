import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';

export enum CancellationStatus { Requested = 'requested', Approved = 'approved', Rejected = 'rejected' }

@Entity('order_cancellations')
export class OrderCancellation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column('uuid') orderId: string;
  @OneToOne(() => Order, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'orderId' }) order: Order;
  @Column({ length: 500 }) reason: string;
  @Column({ type: 'enum', enum: CancellationStatus, default: CancellationStatus.Requested }) status: CancellationStatus;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
