import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { Auth } from '../auth/entities/auth.entity';
import { NewsletterPreference } from './entities/newsletter-preference.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let authRepository: Repository<Auth>;
  let newsletterRepository: Repository<NewsletterPreference>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authRepository = moduleFixture.get<Repository<Auth>>(getRepositoryToken(Auth));
    newsletterRepository = moduleFixture.get<Repository<NewsletterPreference>>(getRepositoryToken(NewsletterPreference));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test (delete in correct order for foreign key constraints)
    await newsletterRepository.query('DELETE FROM newsletter_preferences');
    await authRepository.query('DELETE FROM users');
  });

  afterAll(async () => {
    // Final cleanup (handle potential disconnection gracefully)
    try {
      await newsletterRepository.query('DELETE FROM newsletter_preferences');
      await authRepository.query('DELETE FROM users');
    } catch (error) {
      // Ignore cleanup errors if connection is already closed
    }
  });

  describe('/user/personal-info (PUT)', () => {
    it('should update user personal information with valid userId in query', async () => {
      // Register a user first
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      const updateDto = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };

      return request(app.getHttpServer())
        .put(`/user/personal-info?userId=${auth.id}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('current');
          expect(res.body).toHaveProperty('updated');
          expect(res.body.updated.firstName).toBe('John');
          expect(res.body.updated.lastName).toBe('Doe');
          expect(res.body.updated.phoneNumber).toBe('+1234567890');
        });
    });

    it('should fail with invalid userId', () => {
      const updateDto = {
        firstName: 'John',
        lastName: 'Doe',
      };

      return request(app.getHttpServer())
        .put('/user/personal-info?userId=00000000-0000-0000-0000-000000000000')
        .send(updateDto)
        .expect(404);
    });

    it('should fail without userId in query', () => {
      const updateDto = {
        firstName: 'John',
        lastName: 'Doe',
      };

      return request(app.getHttpServer())
        .put('/user/personal-info')
        .send(updateDto)
        .expect(500); // Validation error for missing userId
    });

    it('should update only provided fields', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      const updateDto = {
        firstName: 'Jane',
      };

      const response = await request(app.getHttpServer())
        .put(`/user/personal-info?userId=${auth.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.updated.firstName).toBe('Jane');
      expect(response.body.updated.lastName).toBeNull();
    });
  });

  describe('/user/login-details (GET)', () => {
    it('should get user login details with valid userId', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      return request(app.getHttpServer())
        .get(`/user/login-details?userId=${auth.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('password', '********');
          expect(res.body).toHaveProperty('isEmailVerified');
        });
    });

    it('should fail with invalid userId', () => {
      return request(app.getHttpServer())
        .get('/user/login-details?userId=00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/user/change-password (POST)', () => {
    it('should change password with valid credentials', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      const changePasswordDto = {
        currentPassword: 'SecurePass123!',
        newPassword: 'NewSecurePass456!',
      };

      return request(app.getHttpServer())
        .post(`/user/change-password?userId=${auth.id}`)
        .send(changePasswordDto)
        .expect(200);
    });

    it('should fail with incorrect current password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      const changePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePass456!',
      };

      return request(app.getHttpServer())
        .post(`/user/change-password?userId=${auth.id}`)
        .send(changePasswordDto)
        .expect(401);
    });

    it('should fail with non-existent userId', () => {
      const changePasswordDto = {
        currentPassword: 'SecurePass123!',
        newPassword: 'NewSecurePass456!',
      };

      return request(app.getHttpServer())
        .post('/user/change-password?userId=00000000-0000-0000-0000-000000000000')
        .send(changePasswordDto)
        .expect(404);
    });
  });

  describe('/user/newsletter-status (GET)', () => {
    it('should get newsletter status for user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      return request(app.getHttpServer())
        .get(`/user/newsletter-status?userId=${auth.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', auth.id);
          expect(res.body).toHaveProperty('isSubscribed');
          expect(res.body).toHaveProperty('marketingConsent');
        });
    });
  });

  describe('/user/newsletter-status (PUT)', () => {
    it('should update newsletter preferences', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      const updateNewsletterDto = {
        userId: auth.id,
        isSubscribed: true,
        marketingConsent: true,
      };

      return request(app.getHttpServer())
        .put('/user/newsletter-status')
        .send(updateNewsletterDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.isSubscribed).toBe(true);
          expect(res.body.marketingConsent).toBe(true);
          expect(res.body).toHaveProperty('subscribedAt');
        });
    });

    it('should unsubscribe user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const auth = await authRepository.findOne({
        where: { email: 'test@example.com' },
      });

      // First subscribe
      await request(app.getHttpServer())
        .put('/user/newsletter-status')
        .send({
          userId: auth.id,
          isSubscribed: true,
          marketingConsent: true,
        });

      // Then unsubscribe
      const response = await request(app.getHttpServer())
        .put('/user/newsletter-status')
        .send({
          userId: auth.id,
          isSubscribed: false,
        })
        .expect(200);

      expect(response.body.isSubscribed).toBe(false);
    });
  });
});
