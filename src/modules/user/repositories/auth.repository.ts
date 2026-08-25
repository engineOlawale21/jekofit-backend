import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { Auth } from '../../auth/entities/auth.entity';
import { IAuthRepository } from './auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(Auth)
    private readonly repository: Repository<Auth>,
  ) {}

  async findById(id: string): Promise<Auth | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Auth | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findOne(options: FindOneOptions<Auth>): Promise<Auth | null> {
    return this.repository.findOne(options);
  }

  async create(userData: Partial<Auth>): Promise<Auth> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async save(user: Auth): Promise<Auth> {
    return this.repository.save(user);
  }

  async update(id: string, userData: Partial<Auth>): Promise<void> {
    await this.repository.update(id, userData);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<Auth[]> {
    return this.repository.find();
  }
}
