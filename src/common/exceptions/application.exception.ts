import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: `${resource} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ResourceConflictException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UnauthorizedOperationException extends HttpException {
  constructor(operation: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: `You are not authorized to ${operation}`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
