import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';
import { SupportTicketReply } from './support-ticket-reply.entity';

export enum SupportTicketStatus { Open = 'open', Closed = 'closed' }

@Entity('support_tickets')
@Index(['email', 'createdAt'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 24, unique: true }) ticketNumber: string;
  @Column('uuid', { nullable: true }) userId: string | null;
  @ManyToOne(() => Auth, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'userId' }) user: Auth | null;
  @Column({ length: 254 }) email: string;
  @Column({ length: 120, default: 'General enquiry' }) subject: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'enum', enum: SupportTicketStatus, default: SupportTicketStatus.Open }) status: SupportTicketStatus;
  @OneToMany(() => SupportTicketReply, (reply) => reply.ticket) replies: SupportTicketReply[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
