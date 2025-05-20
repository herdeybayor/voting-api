import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { DrizzleService } from '../../database/drizzle.service';
import { otps } from '../../database/schema/auth.schema';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedOtp'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('OtpService', () => {
  let service: OtpService;

  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    query: {
      otps: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmailVerificationOtp', () => {
    it('should create and return email verification OTP', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const otp = await service.createEmailVerificationOtp(userId, email);

      expect(otp).toMatch(/^\d{6}$/);
      expect(mockDb.insert).toHaveBeenCalledWith(otps);
      expect(mockDb.values).toHaveBeenCalledWith({
        type: 'email_verification',
        userId,
        email,
        otp: 'hashedOtp',
        expiresAt: expect.any(Date),
      });
    });
  });

  describe('verifyEmailOtp', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const plainOtp = '123456';

    it('should verify valid OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue({
        id: '1',
        otp: 'hashedOtp',
        expiresAt: new Date(Date.now() + 1000),
      });

      const result = await service.verifyEmailOtp(userId, email, plainOtp);
      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledWith(otps);
      expect(mockDb.set).toHaveBeenCalledWith({ isUsed: true });
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmailOtp(userId, email, plainOtp)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue({
        id: '1',
        otp: 'hashedOtp',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmailOtp(userId, email, plainOtp)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createPasswordResetOtp', () => {
    it('should create and return password reset OTP', async () => {
      const email = 'test@example.com';
      const otp = await service.createPasswordResetOtp(email);

      expect(otp).toMatch(/^\d{6}$/);
      expect(mockDb.insert).toHaveBeenCalledWith(otps);
      expect(mockDb.values).toHaveBeenCalledWith({
        type: 'password_reset',
        email: email.toLowerCase(),
        otp: 'hashedOtp',
        expiresAt: expect.any(Date),
      });
    });
  });

  describe('verifyPasswordResetOtp', () => {
    const email = 'test@example.com';
    const plainOtp = '123456';

    it('should verify valid password reset OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue({
        id: '1',
        otp: 'hashedOtp',
        expiresAt: new Date(Date.now() + 1000),
      });

      const result = await service.verifyPasswordResetOtp(email, plainOtp);
      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledWith(otps);
      expect(mockDb.set).toHaveBeenCalledWith({ isUsed: true });
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue(null);

      await expect(service.verifyPasswordResetOtp(email, plainOtp)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      mockDb.query.otps.findFirst.mockResolvedValue({
        id: '1',
        otp: 'hashedOtp',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyPasswordResetOtp(email, plainOtp)).rejects.toThrow(UnauthorizedException);
    });
  });
});
