# Jekofit Backend API

A NestJS backend application built with modular monolith architecture for the Jekofit shopping platform. This project handles user onboarding, authentication, and personal information management.

## Features

- **Email/Password Authentication**: User registration and login with secure password handling
- **OAuth2 Integration**: Social login with Google, Facebook, and Apple
- **User Profile Management**: User profile management including address, phone, etc.
- **Password Reset**: Forgot password and reset password functionality
- **Security**: JWT authentication, rate limiting, input validation
- **Modular Architecture**: Clean separation of concerns with NestJS modules

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, Passport.js
- **Validation**: class-validator, class-transformer
- **Security**: bcryptjs, rate limiting
- **OAuth Providers**: Google, Facebook, Apple

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
└── modules/
    └── onboarding/                 # Onboarding module
        ├── onboarding.module.ts    # Onboarding module definition
        ├── authentication/         # Authentication submodule
        │   ├── authentication.module.ts
        │   ├── controllers/        # Auth controllers
        │   ├── services/           # Auth services
        │   ├── strategies/         # Passport strategies
        │   ├── guards/             # Auth guards
        │   ├── decorators/        # Custom decorators
        │   ├── dto/               # Data transfer objects
        │   └── entities/          # Database entities
        └── profile/               # Profile submodule
            ├── profile.module.ts
            ├── controllers/
            ├── services/
            └── dto/

```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopping-web
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

### User Profile

#### Create User Profile
```http
POST /profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "country": "USA",
  "state": "California",
  "city": "Los Angeles",
  "zipCode": "90001"
}
```

#### Get User Profile
```http
GET /profile
Authorization: Bearer <access-token>
```

#### Update User Profile
```http
PUT /profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Delete User Profile
```http
DELETE /profile
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
- `isEmailVerified` (BOOLEAN)
- `provider` (ENUM: local, google, facebook, apple)
- `providerId` (VARCHAR)
- `refreshToken` (VARCHAR)
- `firstName` (VARCHAR, Nullable)
- `lastName` (VARCHAR, Nullable)
- `phoneNumber` (VARCHAR, Nullable)
- `address` (VARCHAR, Nullable)
- `country` (VARCHAR, Nullable)
- `state` (VARCHAR, Nullable)
- `city` (VARCHAR, Nullable)
- `zipCode` (VARCHAR, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**Note**: Profile fields are integrated into the users table for a normalized structure

### Password Resets Table
- `id` (UUID, Primary Key)
- `token` (VARCHAR)
- `expiresAt` (TIMESTAMP)
- `isUsed` (BOOLEAN)
- `userId` (UUID, Foreign Key)
- `createdAt` (TIMESTAMP)

## License

ISC

## Support

For support and questions, please contact the development team.
