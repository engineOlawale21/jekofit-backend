import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Auth } from './auth.entity';

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

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
