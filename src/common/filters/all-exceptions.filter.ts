import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DrizzleError } from 'drizzle-orm';
import { PostgresErrorCode } from '../exceptions/postgres-error-code.enum';

interface PostgresError {
  code: PostgresErrorCode;
  detail: string;
  constraint: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse() as any;

      // Handle validation errors specifically
      if (response.message && Array.isArray(response.message) && response.message.length > 0) {
        message = response.message;
      } else {
        message = response.message || response;
      }

      error = response.error || exception.name;
    } else if (this.isDrizzleError(exception)) {
      const { statusCode: errStatus, message: errMessage, error: errType } = this.handleDrizzleError(exception);
      statusCode = errStatus;
      message = errMessage;
      error = errType;
    }

    const responseBody = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      error,
      message,
    };

    // Log the error with context
    if (request.url !== '/favicon.ico') {
      this.logger.error({
        exception: {
          name: exception instanceof Error ? exception.name : 'Unknown Error',
          message: exception instanceof Error ? exception.message : 'Unknown error occurred',
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: request.params,
          query: request.query,
        },
        response: responseBody,
      });
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }

  private isDrizzleError(error: any): error is DrizzleError & { cause?: PostgresError } {
    return error instanceof DrizzleError || (error?.cause instanceof Error && 'code' in error.cause);
  }

  private handleDrizzleError(error: DrizzleError & { cause?: PostgresError }) {
    const pgError = error.cause as PostgresError;

    if (!pgError?.code) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Database operation failed',
        error: 'Database Error',
      };
    }

    switch (pgError.code) {
      case PostgresErrorCode.UNIQUE_VIOLATION: {
        const field = this.extractFieldFromUniqueViolation(pgError.detail);
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          error: 'Unique Constraint Violation',
        };
      }

      case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Foreign Key Constraint Violation',
        };

      case PostgresErrorCode.NOT_NULL_VIOLATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required field is missing',
          error: 'Not Null Constraint Violation',
        };

      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Database operation failed',
          error: 'Database Error',
        };
    }
  }

  private extractFieldFromUniqueViolation(detail: string): string {
    const match = detail.match(/Key \((\w+)\)=/);
    return match ? match[1] : 'field';
  }
}
