import { Auth } from '../../auth/entities/auth.entity';
import { FindOneOptions } from 'typeorm';

export interface IAuthRepository {
  findById(id: string): Promise<Auth | null>;
  findByEmail(email: string): Promise<Auth | null>;
  findOne(options: FindOneOptions<Auth>): Promise<Auth | null>;
  create(userData: Partial<Auth>): Promise<Auth>;
  save(user: Auth): Promise<Auth>;
  update(id: string, userData: Partial<Auth>): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Auth[]>;
}
