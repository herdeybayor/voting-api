import { defineConfig } from 'drizzle-kit';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';
import { EnvironmentVariables } from './src/common/interfaces/env';

const configService = new ConfigService<EnvironmentVariables>();
const useSsl = configService.getOrThrow('POSTGRES_SSL') === 'true';

export default defineConfig({
  schema: './src/**/*.schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: configService.getOrThrow('POSTGRES_PORT'),
    user: configService.getOrThrow('POSTGRES_USER'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    database: configService.getOrThrow('POSTGRES_DB'),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  },
});
