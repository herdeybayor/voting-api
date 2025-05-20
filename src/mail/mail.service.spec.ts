import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;
  let getMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({});
    getMock = jest.fn().mockReturnValue('Voting API');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: sendMailMock,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: getMock,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('when sendVerificationEmail is called', () => {
    it('should send verification email with correct parameters', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      await service.sendVerificationEmail(email, otp);

      expect(sendMailMock).toHaveBeenCalledWith({
        to: email,
        subject: 'Verify your Voting API account',
        template: 'verification',
        context: {
          appName: 'Voting API',
          email,
          otp,
          validityInMinutes: 15,
        },
      });
    });
  });

  describe('when sendPasswordResetEmail is called', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      await service.sendPasswordResetEmail(email, otp);

      expect(sendMailMock).toHaveBeenCalledWith({
        to: email,
        subject: 'Reset Your Password',
        text: expect.stringContaining(otp),
        html: expect.stringContaining(otp),
      });
    });
  });

  describe('when sendWelcomeEmail is called', () => {
    it('should send welcome email with correct parameters', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      await service.sendWelcomeEmail(email, name);

      expect(sendMailMock).toHaveBeenCalledWith({
        to: email,
        subject: 'Welcome to Voting API!',
        template: 'welcome',
        context: {
          appName: 'Voting API',
          name,
        },
      });
    });
  });
});
