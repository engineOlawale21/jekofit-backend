import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Design } from './design.entity';

@Entity('design_versions')
@Index(['designId', 'version'], { unique: true })
export class DesignVersion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') designId: string;
  @ManyToOne(() => Design, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'designId' }) design: Design;
  @Column({ type: 'int' }) version: number;
  @Column({ length: 80 }) name: string;
  @Column({ length: 80 }) productName: string;
  @Column({ length: 32 }) garmentColour: string;
  @Column({ type: 'jsonb' }) document: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
}
