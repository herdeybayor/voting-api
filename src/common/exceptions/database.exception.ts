import { HttpException, HttpStatus } from '@nestjs/common';

export class UniqueConstraintViolationException extends HttpException {
  constructor(field: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: `A record with this ${field} already exists`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class DatabaseConstraintViolationException extends HttpException {
  constructor(constraint: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Constraint Violation',
        message: `Database constraint violation: ${constraint}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
