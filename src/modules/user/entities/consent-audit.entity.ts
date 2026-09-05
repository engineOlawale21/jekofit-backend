import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';

export enum ConsentType {
  Newsletter = 'newsletter',
  Marketing = 'marketing',
}

@Entity('consent_audits')
@Index(['userId', 'createdAt'])
export class ConsentAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Column({ type: 'enum', enum: ConsentType })
  type: ConsentType;

  @Column()
  granted: boolean;

  @Column({ length: 40, default: 'account_settings' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
