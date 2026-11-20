import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("WEB_URL") ?? "http://localhost:3000",
    credentials: true,
  });

  await app.listen(Number(config.get<string>("API_PORT") ?? 3001));
}
await bootstrap();
