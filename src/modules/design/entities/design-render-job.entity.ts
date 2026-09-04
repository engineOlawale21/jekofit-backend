import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Design } from './design.entity';

export enum DesignRenderJobStatus { Queued = 'queued', Processing = 'processing', Ready = 'ready', Failed = 'failed' }

@Entity('design_render_jobs')
@Index(['status', 'createdAt'])
@Index(['designId', 'version'], { unique: true })
export class DesignRenderJob {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') designId: string;
  @ManyToOne(() => Design, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'designId' }) design: Design;
  @Column({ type: 'int' }) version: number;
  @Column({ type: 'enum', enum: DesignRenderJobStatus, default: DesignRenderJobStatus.Queued }) status: DesignRenderJobStatus;
  @Column({ type: 'jsonb' }) canvasSnapshot: Record<string, string>;
  @Column({ type: 'text', nullable: true }) failureReason: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
