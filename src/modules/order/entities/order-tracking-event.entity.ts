import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_tracking_events')
@Index(['orderId', 'occurredAt'])
export class OrderTrackingEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') orderId: string;
  @ManyToOne(() => Order, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'orderId' }) order: Order;
  @Column({ length: 48 }) status: string;
  @Column({ length: 240 }) message: string;
  @Column({ length: 120, nullable: true }) location: string | null;
  @Column({ type: 'timestamptz' }) occurredAt: Date;
  @CreateDateColumn() createdAt: Date;
}
