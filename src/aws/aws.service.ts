import {
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  s3Client: S3Client;
  s3Bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.s3Bucket = this.configService.getOrThrow('AWS_S3_BUCKET');
  }

  async uploadFileToS3({
    s3Bucket = this.s3Bucket,
    file,
    folder,
    fileName,
    ACL = 'private',
  }: {
    s3Bucket?: string;
    file: Express.Multer.File;
    folder: string;
    fileName?: string;
    ACL?: ObjectCannedACL;
  }) {
    const finalFileName = fileName ? fileName : `${crypto.randomBytes(30).toString('hex')}`;

    const params: PutObjectCommandInput = {
      ACL,
      Bucket: s3Bucket,
      Body: file.buffer,
      ContentType: file.mimetype,
      Key: `${this.configService.getOrThrow('NODE_ENV')}/${folder}/${finalFileName}`,
      ServerSideEncryption: 'AES256', //added this to encrypt the files on aws
    };

    try {
      const uploadData = new Upload({
        params: params,
        client: this.s3Client,
        leavePartsOnError: false,
      });

      const data = await uploadData.done();

      if (!data.Location) return null;

      return data.Location;
    } catch (error: any) {
      this.logger.error(error, 'error');
      return null;
    }
  }

  async deleteFileFromS3({ s3Bucket = this.s3Bucket, Location }: { s3Bucket?: string; Location: string | null }) {
    if (!Location || !Location.includes(s3Bucket)) return;

    const params = {
      Bucket: s3Bucket,
      Key: Location.split('amazonaws.com/').pop() as string,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(params));

      return true;
    } catch (error: any) {
      this.logger.error(error, 'error');
      return false;
    }
  }

  async getSignedUrlFromS3({
    s3Bucket = this.s3Bucket,
    Location,
    Expires = 60 * 60 * 24,
  }: {
    s3Bucket?: string;
    Location: string;
    Expires?: number;
  }) {
    if (!Location.includes(s3Bucket)) return null;

    const params = {
      Bucket: s3Bucket,
      Key: Location.split('amazonaws.com/').pop(),
    };

    try {
      const signedUrl = await getSignedUrl(this.s3Client, new GetObjectCommand(params), { expiresIn: Expires });

      return signedUrl;
    } catch (error: any) {
      this.logger.error(error, 'error');
      return null;
    }
  }
}
