import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = formatValidationErrors(errors);
        return new BadRequestException({
          statusCode: 400,
          error: 'Validation Error',
          message: formattedErrors,
        });
      },
    });
  }
}

function formatValidationErrors(errors: ValidationError[], parentProperty = ''): string[] {
  return errors.reduce((acc: string[], error: ValidationError) => {
    const property = parentProperty ? `${parentProperty}.${error.property}` : error.property;

    if (error.constraints) {
      const messages = Object.values(error.constraints).map((message) => `${property} - ${message}`);
      acc.push(...messages);
    }

    if (error.children?.length) {
      const childMessages = formatValidationErrors(error.children, property);
      acc.push(...childMessages);
    }

    return acc;
  }, []);
}
