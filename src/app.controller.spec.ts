import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health check response', () => {
      const response = appController.healthCheck();

      expect(response).toMatchObject({
        status: 'ok',
        message: 'BD Voting API API is running',
      });

      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.uptime).toBe('number');
    });
  });
});
