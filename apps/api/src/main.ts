import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  // Credentials are required so the browser sends the session cookie.
  app.enableCors({
    origin: config.get<string>('WEB_URL') ?? 'http://localhost:3000',
    credentials: true,
  });
  // Web runs on 3000, so the API defaults to 3001.
  await app.listen(Number(config.get<string>('API_PORT') ?? 3001));
}
await bootstrap();
