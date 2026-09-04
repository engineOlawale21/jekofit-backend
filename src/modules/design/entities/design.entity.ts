import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';

@Entity('designs')
@Index(['userId', 'updatedAt'])
export class Design {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @ManyToOne(() => Auth, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: Auth;
  @Column({ length: 80 }) name: string;
  @Column({ length: 80, default: 'Jekofit T-Shirt' }) productName: string;
  @Column({ length: 32, default: '#ffffff' }) garmentColour: string;
  @Column({ type: 'jsonb', default: {} }) canvas: Record<string, unknown>;
  @Column({ type: 'int', default: 0 }) renderVersion: number;
  @Column({ length: 16, default: 'queued' }) renderStatus: string;
  @Column({ default: false }) isFavourite: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
