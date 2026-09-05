import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';

@Entity('delivery_addresses')
@Index(['userId', 'createdAt'])
export class DeliveryAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Auth;

  @Column({ length: 60, default: 'Delivery address' })
  label: string;

  @Column({ length: 80 })
  firstName: string;

  @Column({ length: 80 })
  lastName: string;

  @Column({ length: 32 })
  phoneNumber: string;

  @Column({ length: 160 })
  addressLine1: string;

  @Column({ length: 160, nullable: true })
  addressLine2: string | null;

  @Column({ length: 80 })
  city: string;

  @Column({ length: 80 })
  state: string;

  @Column({ length: 20 })
  postalCode: string;

  @Column({ length: 2 })
  countryCode: string;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
