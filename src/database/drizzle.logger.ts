import { Logger } from '@nestjs/common';
import { Logger as DrizzleLogger } from 'drizzle-orm';

export class DrizzleCustomLogger implements DrizzleLogger {
  private readonly logger = new Logger('DrizzleORM');

  logQuery(query: string, params: unknown[]): void {
    const sqlQuery = this.formatQuery(query, params);
    this.logger.debug(`Executing query: ${sqlQuery}`);
  }

  private formatQuery(query: string, params: unknown[]): string {
    let formattedQuery = query;
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const formattedParam = this.formatParameter(param);
        formattedQuery = formattedQuery.replace(`$${index + 1}`, formattedParam);
      });
    }
    return formattedQuery;
  }

  private formatParameter(param: unknown): string {
    if (param === null) {
      return 'NULL';
    }
    if (param === undefined) {
      return 'DEFAULT';
    }
    if (typeof param === 'string') {
      return `'${param}'`;
    }
    if (typeof param === 'number') {
      return param.toString();
    }
    if (param instanceof Date) {
      return `'${param.toISOString()}'`;
    }
    if (Array.isArray(param)) {
      return `ARRAY[${param.map((item) => this.formatParameter(item)).join(', ')}]`;
    }
    if (typeof param === 'object') {
      try {
        const stringified = JSON.stringify(param, null, 2);
        return `'${stringified}'`;
      } catch {
        return "'[Complex Object]'";
      }
    }
    return "'[Unknown Type]'";
  }
}
