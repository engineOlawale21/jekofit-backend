import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

export enum SupportReplyAuthor { Customer = 'customer', Agent = 'agent' }

@Entity('support_ticket_replies')
@Index(['ticketId', 'createdAt'])
export class SupportTicketReply {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') ticketId: string;
  @ManyToOne(() => SupportTicket, (ticket) => ticket.replies, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'ticketId' }) ticket: SupportTicket;
  @Column({ type: 'enum', enum: SupportReplyAuthor }) author: SupportReplyAuthor;
  @Column({ type: 'text' }) message: string;
  @CreateDateColumn() createdAt: Date;
}
