import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { DatabaseModule } from "./infrastructure/database/database.module.js";
import { MailModule } from "./infrastructure/mail/mail.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { GeoModule } from "./modules/geo/geo.module.js";
import { ConditionsModule } from "./modules/conditions/conditions.module.js";
import { SavedTreksModule } from "./modules/saved-treks/saved-treks.module.js";
import { StaysModule } from "./modules/stays/stays.module.js";
import { HealthModule } from "./modules/health/health.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(import.meta.dirname, "../../../.env"),
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    AdminModule,
    GeoModule,
    StaysModule,
    SavedTreksModule,
    ConditionsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
