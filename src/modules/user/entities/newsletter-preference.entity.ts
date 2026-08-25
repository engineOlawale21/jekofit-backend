import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';

@Entity('newsletter_preferences')
export class NewsletterPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Column({ default: false })
  isSubscribed: boolean;

  @Column({ nullable: true })
  subscribedAt: Date;

  @Column({ nullable: true })
  unsubscribedAt: Date;

  @Column({ default: false })
  marketingConsent: boolean;

  @Column({ nullable: true })
  consentGivenAt: Date;

  @Column({ nullable: true })
  consentWithdrawnAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
