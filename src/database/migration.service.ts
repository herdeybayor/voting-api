import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { EnvironmentVariables } from '../common/interfaces/env';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  /**
   * Run database migrations from the drizzle directory
   * @param pool The database pool connection
   * @returns Promise that resolves when migrations are complete
   */
  async runMigrations(pool: Pool): Promise<void> {
    try {
      const shouldMigrate = this.configService.get<boolean>('AUTO_MIGRATE_DB', false);

      if (!shouldMigrate) {
        this.logger.log('Auto migration disabled, skipping database migrations');
        return;
      }

      this.logger.log('Running database migrations...');

      const db = drizzle(pool);

      // Run migrations from the drizzle directory
      await migrate(db, { migrationsFolder: './drizzle' });

      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Failed to run database migrations', error);
      throw error;
    }
  }
}
