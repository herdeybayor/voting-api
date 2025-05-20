import { Test, TestingModule } from '@nestjs/testing';
import { AwsService } from './aws.service';
import { ConfigService } from '@nestjs/config';
describe('AwsService', () => {
  let service: AwsService;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-bucket'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<AwsService>(AwsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
