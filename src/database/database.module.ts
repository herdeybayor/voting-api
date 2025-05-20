import { Global, Module } from '@nestjs/common';
import { ConfigurableDatabaseModule, CONNECTION_POOL, DATABASE_OPTIONS } from './database.module-definition';
import { DatabaseOptions } from './interfaces/database-options.interface';
import { Pool } from 'pg';
import { DrizzleService } from './drizzle.service';
import { MigrationService } from './migration.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  exports: [DrizzleService],
  providers: [
    DrizzleService,
    MigrationService,
    {
      provide: CONNECTION_POOL,
      inject: [DATABASE_OPTIONS],
      useFactory: (databaseOptions: DatabaseOptions) => {
        return new Pool({
          host: databaseOptions.host,
          port: databaseOptions.port,
          user: databaseOptions.user,
          password: databaseOptions.password,
          database: databaseOptions.database,
          ssl: databaseOptions.ssl
            ? {
                rejectUnauthorized: false,
              }
            : false,
        });
      },
    },
  ],
})
export class DatabaseModule extends ConfigurableDatabaseModule {}
