export const appConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: Number(process.env.API_PORT ?? 3001),
  webPort: Number(process.env.WEB_PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://yompi_admin:yompi_password@localhost:5432/yompi_db?schema=public",
} as const;
