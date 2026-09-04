import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SupportTicketStatus { Open = 'open', Closed = 'closed' }

@Entity('support_tickets')
@Index(['email', 'createdAt'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 254 }) email: string;
  @Column({ length: 120, default: 'General enquiry' }) subject: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'enum', enum: SupportTicketStatus, default: SupportTicketStatus.Open }) status: SupportTicketStatus;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
