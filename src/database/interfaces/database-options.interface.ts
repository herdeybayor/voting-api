import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as databaseSchema from '../schema';
import * as relations from '../relations';

export type Database = NodePgDatabase<typeof databaseSchema & typeof relations>;

export interface DatabaseOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}
