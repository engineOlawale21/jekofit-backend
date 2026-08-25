import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Auth } from './auth.entity';

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @ManyToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Auth;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
