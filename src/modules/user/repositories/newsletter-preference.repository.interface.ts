import { NewsletterPreference } from '../entities/newsletter-preference.entity';
import { FindOneOptions } from 'typeorm';

export interface INewsletterPreferenceRepository {
  findById(id: string): Promise<NewsletterPreference | null>;
  findByUserId(userId: string): Promise<NewsletterPreference | null>;
  findOne(options: FindOneOptions<NewsletterPreference>): Promise<NewsletterPreference | null>;
  create(preferenceData: Partial<NewsletterPreference>): Promise<NewsletterPreference>;
  save(preference: NewsletterPreference): Promise<NewsletterPreference>;
  update(id: string, preferenceData: Partial<NewsletterPreference>): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<NewsletterPreference[]>;
}
