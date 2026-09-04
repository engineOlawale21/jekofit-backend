import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { Auth } from './entities/auth.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authRepository: Repository<Auth>;
  let emailVerificationRepository: Repository<EmailVerification>;
  let passwordResetRepository: Repository<PasswordReset>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    authRepository = moduleFixture.get<Repository<Auth>>(getRepositoryToken(Auth));
    emailVerificationRepository = moduleFixture.get<Repository<EmailVerification>>(getRepositoryToken(EmailVerification));
    passwordResetRepository = moduleFixture.get<Repository<PasswordReset>>(getRepositoryToken(PasswordReset));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await emailVerificationRepository.query('DELETE FROM newsletter_preferences');
    await emailVerificationRepository.query('DELETE FROM email_verifications');
    await authRepository.query('DELETE FROM password_resets');
    await authRepository.query('DELETE FROM oauth_accounts');
    await authRepository.query('DELETE FROM users');
  });

  afterAll(async () => {
    try {
      await emailVerificationRepository.query('DELETE FROM newsletter_preferences');
      await emailVerificationRepository.query('DELETE FROM email_verifications');
      await authRepository.query('DELETE FROM password_resets');
      await authRepository.query('DELETE FROM oauth_accounts');
      await authRepository.query('DELETE FROM users');
    } catch (error) {
      // Ignore
    }
  });

  async function createVerifiedUser(email = 'test@example.com', password = 'SecurePass123!') {
    await request(app.getHttpServer()).post('/auth/register').send({ email, password });
    await authRepository.update({ email }, { isEmailVerified: true });
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return loginRes.body;
  }

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with duplicate email', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should fail with invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with weak password', () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/register/personal-info (POST)', () => {
    it('should register with personal info', () => {
      const payload = {
        email: 'john@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        gender: 'Male',
        age: 25,
        weight: 75,
        height: 180,
        dailyGoal: 10000,
      };

      return request(app.getHttpServer())
        .post('/auth/register/personal-info')
        .send(payload)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.user).toHaveProperty('firstName', 'John');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials after email is verified', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      await request(app.getHttpServer()).post('/auth/register').send({ email, password });
      await authRepository.update({ email }, { isEmailVerified: true });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should fail when email is not verified', async () => {
      const email = 'unverified@example.com';
      const password = 'SecurePass123!';

      await request(app.getHttpServer()).post('/auth/register').send({ email, password });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('verify your email');
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword123!' })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'SecurePass123!' })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const authData = await createVerifiedUser();

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: authData.refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const authData = await createVerifiedUser();

      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authData.accessToken}`)
        .expect(204);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should send password reset email', async () => {
      await createVerifiedUser('reset@example.com', 'SecurePass123!');

      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Password reset email sent');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should reset password with valid token', async () => {
      await createVerifiedUser('reset2@example.com', 'SecurePass123!');

      const user = await authRepository.findOne({ where: { email: 'reset2@example.com' } });
      const rawToken = 'valid-test-token-123456';
      const hashedToken = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await passwordResetRepository.save({
        userId: user!.id,
        token: hashedToken,
        expiresAt,
        isUsed: false,
      });

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'NewSecurePass456!',
        })
        .expect(200);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewSecurePass456!',
        })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should get current user', async () => {
      const authData = await createVerifiedUser('me@example.com', 'SecurePass123!');

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authData.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'me@example.com');
          expect(res.body).toHaveProperty('id');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get user profile', async () => {
      const authData = await createVerifiedUser('prof@example.com', 'SecurePass123!');

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authData.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'prof@example.com');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
