import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import Joi from 'joi';
import { EnvironmentVariables } from './common/interfaces/env';
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required().min(1).max(65535),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_SSL: Joi.boolean().required(),
        // Mail configuration
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),
        SMTP_FROM: Joi.string().email().required(),
        SMTP_SECURE: Joi.boolean().default(false),
        APP_NAME: Joi.string().default('Voting API'),
        FRONTEND_URL: Joi.string().uri().required(),
        // JWT configuration
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().required(),
        // Apple configuration
        APPLE_CLIENT_ID: Joi.string().required(),
        APPLE_TEAM_ID: Joi.string().required(),
        APPLE_KEY_ID: Joi.string().required(),
        APPLE_PRIVATE_KEY: Joi.string().required(),
        APPLE_CALLBACK_URL: Joi.string().uri().required(),
        // Google configuration
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        // AWS configuration
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_REGION: Joi.string().required(),
        AWS_S3_BUCKET: Joi.string().required(),
      }),
      isGlobal: true,
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        host: configService.getOrThrow('POSTGRES_HOST'),
        port: configService.getOrThrow('POSTGRES_PORT'),
        user: configService.getOrThrow('POSTGRES_USER'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        database: configService.getOrThrow('POSTGRES_DB'),
        ssl: configService.getOrThrow('POSTGRES_SSL') === 'true',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
