import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: `http://localhost:${process.env.WEB_PORT ?? 3000}` });
  const config = app.get(ConfigService);
  // Web runs on 3000, so the API defaults to 3001.
  const port = Number(config.get<string>('API_PORT') ?? 3001);
  await app.listen(port);
}
await bootstrap();
