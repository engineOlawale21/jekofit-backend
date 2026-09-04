# Jekofit Backend API

The screen-aligned backend roadmap and current capability checklist are maintained in [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md).

A NestJS backend application built with modular monolith architecture for the Jekofit fitness platform. This project handles user authentication, profile management, and newsletter preferences.

## Features

- **Email/Password Authentication**: User registration and login with secure password handling
- **OAuth2 Integration**: Social login with Google, Facebook, and Apple
- **User Profile Management**: User profile management including personal information
- **Password Reset**: Forgot password and reset password functionality
- **Email Verification**: Email verification system for user accounts
- **Newsletter Management**: User newsletter subscription preferences
- **Security**: JWT authentication, rate limiting, input validation
- **Modular Architecture**: Clean separation of concerns with NestJS modules

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, Passport.js
- **Validation**: class-validator, class-transformer
- **Security**: bcryptjs, rate limiting
- **OAuth Providers**: Google, Facebook, Apple
- **API Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
└── modules/
    ├── auth/                        # Authentication module
    │   ├── auth.module.ts          # Auth module definition
    │   ├── controllers/            # Auth controllers
    │   │   ├── auth.controller.ts
    │   │   └── oauth.controller.ts
    │   ├── services/               # Auth services
    │   │   ├── auth.service.ts
    │   │   ├── oauth.service.ts
    │   │   ├── profile.service.ts
    │   │   └── email.service.ts
    │   ├── strategies/             # Passport strategies
    │   │   ├── jwt.strategy.ts
    │   │   ├── google.strategy.ts
    │   │   ├── facebook.strategy.ts
    │   │   └── apple.strategy.ts
    │   ├── guards/                 # Auth guards
    │   │   └── jwt-auth.guard.ts
    │   ├── decorators/            # Custom decorators
    │   │   ├── current-user.decorator.ts
    │   │   └── public.decorator.ts
    │   ├── dto/                   # Data transfer objects
    │   │   ├── auth-response.dto.ts
    │   │   ├── login.dto.ts
    │   │   ├── register.dto.ts
    │   │   ├── register-personal-info.dto.ts
    │   │   ├── forgot-password.dto.ts
    │   │   ├── reset-password.dto.ts
    │   │   ├── verify-email.dto.ts
    │   │   ├── send-verification.dto.ts
    │   │   └── update-profile.dto.ts
    │   └── entities/              # Database entities
    │       ├── auth.entity.ts
    │       ├── email-verification.entity.ts
    │       ├── oauth-account.entity.ts
    │       └── password-reset.entity.ts
    └── user/                       # User module
        ├── user.module.ts          # User module definition
        ├── controllers/            # User controllers
        │   └── user.controller.ts
        ├── services/               # User services
        │   └── user.service.ts
        ├── repositories/           # Data repositories
        │   ├── auth.repository.ts
        │   ├── auth.repository.interface.ts
        │   ├── newsletter-preference.repository.ts
        │   └── newsletter-preference.repository.interface.ts
        ├── dto/                   # Data transfer objects
        │   ├── personal-info.dto.ts
        │   ├── change-password.dto.ts
        │   ├── email-verification.dto.ts
        │   ├── login-details.dto.ts
        │   ├── newsletter-status.dto.ts
        │   └── update-newsletter.dto.ts
        └── entities/              # Database entities
            └── newsletter-preference.entity.ts

```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Database migrations and background jobs

Development may use TypeORM synchronization. Production never synchronizes the schema: it runs migrations at startup.

```bash
# Optional local infrastructure (requires Docker Desktop)
docker compose up -d postgres redis

# Generate a reviewed migration from entity changes, then apply it
npm run migration:generate
npm run migration:run
```

Redis is required for email, cleanup and production queues. Production jobs are created only after a verified payment transaction commits and are processed asynchronously by Bull.
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/engineOlawale21/jekofit-backend.git
   cd jekofit-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=jekofit

   # JWT
   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # OAuth2 - Google
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

   # OAuth2 - Facebook
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

   # OAuth2 - Apple
   APPLE_CLIENT_ID=your-apple-client-id
   APPLE_TEAM_ID=your-apple-team-id
   APPLE_KEY_ID=your-apple-key-id
   APPLE_PRIVATE_KEY_PATH=./AuthKey.p8
   APPLE_CALLBACK_URL=http://localhost:3000/auth/apple/callback

   # Email (for password reset)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@jekofit.com

   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   ```

4. **Set up database**
   ```bash
   psql -U postgres
   CREATE DATABASE jekofit;
   \q
   ```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

### Accessing Swagger Documentation
Once the application is running, you can access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

Swagger provides:
- Interactive API testing
- Request/response examples
- Authentication configuration
- Schema documentation

## API Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Register with Personal Info
```http
POST /auth/register/personal-info
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access-token>
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access-token>
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <access-token>
```

### Email Verification

#### Send Verification Email
```http
POST /auth/send-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

### Password Reset

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!"
}
```

### OAuth2

#### Google OAuth
```http
GET /auth/google
GET /auth/google/callback
```

#### Facebook OAuth
```http
GET /auth/facebook
GET /auth/facebook/callback
```

#### Apple OAuth
```http
GET /auth/apple
GET /auth/apple/callback
```

### User Management

#### Get Personal Info
```http
GET /user/personal-info
Authorization: Bearer <access-token>
```

#### Update Personal Info
```http
PUT /user/personal-info
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890"
}
```

#### Get Login Details
```http
GET /user/login-details
Authorization: Bearer <access-token>
```

#### Get Email Verification Status
```http
GET /user/email-verification
Authorization: Bearer <access-token>
```

#### Change Password
```http
POST /user/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### Get Newsletter Status
```http
GET /user/newsletter-status
Authorization: Bearer <access-token>
```

#### Subscribe to Newsletter
```http
POST /user/newsletter/subscribe
Authorization: Bearer <access-token>
```

#### Unsubscribe from Newsletter
```http
POST /user/newsletter/unsubscribe
Authorization: Bearer <access-token>
```

## OAuth2 Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:3000/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID with Sign in with Apple capability
3. Create a Services ID
4. Generate a private key (.p8 file)
5. Copy credentials to `.env` and place .p8 file in project root

## Security Features

- **Password Hashing**: Using bcryptjs with salt rounds of 10
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive DTO validation
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data stored in environment

## Development

### Code Style
The project follows NestJS best practices and TypeScript conventions.

### Testing
```bash
npm run test
```

### Linting
```bash
npm run lint
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR)
- `isEmailVerified` (BOOLEAN, Default: false)
- `emailVerifiedAt` (TIMESTAMP, Nullable)
- `refreshToken` (VARCHAR, Nullable)
- `firstName` (VARCHAR, Nullable)
- `lastName` (VARCHAR, Nullable)
- `phoneNumber` (VARCHAR, Nullable)
- `address` (VARCHAR, Nullable)
- `country` (VARCHAR, Nullable)
- `state` (VARCHAR, Nullable)
- `city` (VARCHAR, Nullable)
- `zipCode` (VARCHAR, Nullable)
- `dateOfBirth` (DATE, Nullable)
- `gender` (VARCHAR, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Email Verifications Table
- `id` (UUID, Primary Key)
- `code` (VARCHAR, Unique)
- `expiresAt` (TIMESTAMP)
- `isUsed` (BOOLEAN, Default: false)
- `userId` (UUID, Foreign Key)
- `createdAt` (TIMESTAMP)

### Password Resets Table
- `id` (UUID, Primary Key)
- `token` (VARCHAR)
- `expiresAt` (TIMESTAMP)
- `isUsed` (BOOLEAN, Default: false)
- `userId` (UUID, Foreign Key)
- `createdAt` (TIMESTAMP)

### OAuth Accounts Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `provider` (VARCHAR)
- `providerUserId` (VARCHAR, Indexed)
- `accessToken` (VARCHAR, Nullable)
- `refreshToken` (VARCHAR, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Newsletter Preferences Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Unique, Foreign Key)
- `isSubscribed` (BOOLEAN, Default: false)
- `subscribedAt` (TIMESTAMP, Nullable)
- `unsubscribedAt` (TIMESTAMP, Nullable)
- `marketingConsent` (BOOLEAN, Default: false)
- `consentGivenAt` (TIMESTAMP, Nullable)
- `consentWithdrawnAt` (TIMESTAMP, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## License

ISC

## Support

For support and questions, please contact the development team.
