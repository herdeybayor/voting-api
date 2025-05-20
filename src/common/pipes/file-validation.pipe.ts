import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly validMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    private readonly maxSize: number = 5 * 1024 * 1024, // 5MB default
  ) {}

  transform(value: Express.Multer.File) {
    // Check if file exists
    if (!value) {
      throw new BadRequestException('File is required');
    }

    // Check file type
    if (!this.validMimeTypes.includes(value.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed types are: ${this.validMimeTypes.join(', ')}`);
    }

    // Check file size
    if (value.size > this.maxSize) {
      throw new BadRequestException(`File is too large. Maximum size is ${this.maxSize / 1024 / 1024}MB`);
    }

    return value;
  }
}
