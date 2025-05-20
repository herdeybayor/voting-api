import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { CONNECTION_POOL } from './database.module-definition';
import { DrizzleCustomLogger } from './drizzle.logger';
import { Database } from './interfaces/database-options.interface';
import * as databaseSchema from './schema';
import * as relations from './relations';
import { MigrationService } from './migration.service';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  public db: Database;

  constructor(
    @Inject(CONNECTION_POOL) private readonly pool: Pool,
    private readonly migrationService: MigrationService,
  ) {
    this.db = drizzle(this.pool, {
      schema: { ...databaseSchema, ...relations },
      logger: new DrizzleCustomLogger(),
      casing: 'snake_case',
    });
  }

  async onModuleInit() {
    try {
      // Test the connection
      await this.pool.query('SELECT 1');
      this.logger.log('Database connection established');

      // Run migrations if enabled
      await this.migrationService.runMigrations(this.pool);
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.end();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error while closing database connection', error);
      throw error;
    }
  }

  // Helper method to get a client from the pool with error handling
  async getClient() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      this.logger.error('Failed to get database client', error);
      throw error;
    }
  }
}
