import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { FavouriteModule } from './modules/favourite/favourite.module';
import { OrderModule } from './modules/order/order.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { SupportModule } from './modules/support/support.module';
import { DesignModule } from './modules/design/design.module';

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Database ──────────────────────────────────────────────────────────
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'jekofit',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      migrationsTableName: 'schema_migrations',
      migrationsRun: process.env.NODE_ENV === 'production',
      // Development convenience only. Production exclusively runs migrations.
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      // Connection pool tuning for better throughput under load
      extra: {
        max: 20,                // max pool size
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 3_000,
      },
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60, // 60 req / 60 s globally (per-route overrides tighten sensitive endpoints)
      },
    ]),

    // ── Bull (background jobs) ────────────────────────────────────────────
    // BullModule.forRoot registers a shared Redis connection that all queues
    // in every feature module reuse — one connection pool for the whole app.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379'),
          password: configService.get('REDIS_PASSWORD') || undefined,
          // Reconnect strategy: try forever with an exponential back-off
          // capped at 30 s so Redis restarts don't kill the process
          retryStrategy: (times: number) => Math.min(times * 500, 30_000),
        },
        // Global prefix prevents key collisions if Redis is shared
        prefix: `jekofit:${configService.get('NODE_ENV') || 'development'}`,
      }),
      inject: [ConfigService],
    }),

    // ── Cron / scheduled tasks ────────────────────────────────────────────
    // Enables @Cron() decorators inside processors
    ScheduleModule.forRoot(),

    // ── Feature modules ───────────────────────────────────────────────────
    AuthModule,
    UserModule,
    CatalogModule,
    CartModule,
    FavouriteModule,
    OrderModule,
    CheckoutModule,
    SupportModule,
    DesignModule,
  ],
})
export class AppModule {}
