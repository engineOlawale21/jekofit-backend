import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';
export enum ProductAssetStatus { Queued = 'queued', Processing = 'processing', Ready = 'ready', Failed = 'failed' }
@Entity('product_assets') @Index(['productId', 'createdAt'])
export class ProductAsset {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') productId: string;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'productId' }) product: Product;
  @Column({ length: 64 }) originalKey: string;
  @Column({ length: 64 }) contentType: string;
  @Column({ type: 'int' }) byteSize: number;
  @Column({ type: 'int', nullable: true }) width: number | null;
  @Column({ type: 'int', nullable: true }) height: number | null;
  @Column({ type: 'enum', enum: ProductAssetStatus, default: ProductAssetStatus.Queued }) status: ProductAssetStatus;
  @Column({ type: 'jsonb', default: () => "'{}'" }) variants: Record<string, { url: string; width: number; height: number }>;
  @Column({ type: 'text', nullable: true }) failureReason: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
