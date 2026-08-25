import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { NewsletterPreference } from '../entities/newsletter-preference.entity';
import { INewsletterPreferenceRepository } from './newsletter-preference.repository.interface';

@Injectable()
export class NewsletterPreferenceRepository implements INewsletterPreferenceRepository {
  constructor(
    @InjectRepository(NewsletterPreference)
    private readonly repository: Repository<NewsletterPreference>,
  ) {}

  async findById(id: string): Promise<NewsletterPreference | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<NewsletterPreference | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findOne(options: FindOneOptions<NewsletterPreference>): Promise<NewsletterPreference | null> {
    return this.repository.findOne(options);
  }

  async create(preferenceData: Partial<NewsletterPreference>): Promise<NewsletterPreference> {
    const preference = this.repository.create(preferenceData);
    return this.repository.save(preference);
  }

  async save(preference: NewsletterPreference): Promise<NewsletterPreference> {
    return this.repository.save(preference);
  }

  async update(id: string, preferenceData: Partial<NewsletterPreference>): Promise<void> {
    await this.repository.update(id, preferenceData);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<NewsletterPreference[]> {
    return this.repository.find();
  }
}
