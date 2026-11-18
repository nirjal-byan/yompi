import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { MailModule } from './infrastructure/mail/mail.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    // The repo-root .env is the single source of truth for local config.
    // This file lives in apps/api/src (or apps/api/dist once built), so the
    // root is three levels up. Real environment variables take precedence.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(import.meta.dirname, '../../../.env'),
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
