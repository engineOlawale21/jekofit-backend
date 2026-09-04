import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum ProductionJobStatus { Queued = 'queued', InProduction = 'in_production', Ready = 'ready', Cancelled = 'cancelled' }

@Entity('production_jobs')
@Index(['status', 'createdAt'])
@Index(['orderItemId'], { unique: true })
export class ProductionJob {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') orderItemId: string;
  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'orderItemId' }) orderItem: OrderItem;
  @Column({ type: 'enum', enum: ProductionJobStatus, default: ProductionJobStatus.Queued }) status: ProductionJobStatus;
  @Column({ type: 'jsonb', default: {} }) productionSnapshot: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
