import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DrizzleService } from '../../database/drizzle.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';
import { OtpService } from './otp.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { users } from '../../database/schema/users.schema';
import * as bcrypt from 'bcrypt';
import { UniqueConstraintViolationException } from '../../common/exceptions/database.exception';
import { TokenService } from './token.service';
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('ms', () => jest.fn().mockReturnValue(3600000));

describe('AuthService', () => {
  let service: AuthService;

  const mockDb = {
    query: {
      users: {
        findFirst: jest.fn(),
      },
      refreshTokens: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('1h'),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt_token'),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockOtpService = {
    createEmailVerificationOtp: jest.fn().mockResolvedValue('123456'),
    verifyEmailOtp: jest.fn().mockResolvedValue(true),
    createPasswordResetOtp: jest.fn().mockResolvedValue('123456'),
    verifyPasswordResetOtp: jest.fn().mockResolvedValue(true),
  };

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({ sub: 'user123' }),
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    isEmailVerified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user and send verification email', async () => {
      mockDb.returning.mockResolvedValue([mockUser]);

      const result = await service.register(registerDto);

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.values).toHaveBeenCalledWith({
        email: registerDto.email.toLowerCase(),
        password: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw UniqueConstraintViolationException for duplicate email', async () => {
      mockDb.returning.mockRejectedValue({
        code: '23505',
        constraint: 'users_email_unique',
      });

      await expect(service.register(registerDto)).rejects.toThrow(UniqueConstraintViolationException);
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and send welcome email', async () => {
      mockDb.update.mockReturnThis();
      mockDb.returning.mockResolvedValue([{ ...mockUser, isEmailVerified: true }]);

      const result = await service.verifyEmail(mockUser.id, mockUser.email, '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({ isEmailVerified: true });
      expect(mockMailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'valid_refresh_token';
      mockDb.query.refreshTokens.findFirst.mockResolvedValue({
        userId: mockUser.id,
        revoked: false,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await service.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockDb.query.refreshTokens.findFirst.mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result.message).toBe('Password reset instructions sent to your email');
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      await expect(service.requestPasswordReset('nonexistent@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      mockDb.update.mockReturnThis();
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockDb.returning.mockResolvedValue([mockUser]);

      const result = await service.resetPassword(mockUser.email, '123456', 'newPassword');

      expect(result.message).toBe('Password reset successful');
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({
        password: 'hashedPassword',
      });
    });
  });

  describe('verifyToken', () => {
    it('should return valid=true and payload for a valid token with existing user', async () => {
      // Setup
      const token = 'valid-access-token';
      const payload = { sub: 'user123', iat: 1626361234, exp: 1626364834 };
      mockTokenService.verifyAccessToken.mockResolvedValue(payload);
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      // Test
      const result = await service.verifyToken(token);

      // Verify
      expect(result).toEqual({
        valid: true,
        payload,
      });
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
    });

    it('should return valid=false when token verification fails', async () => {
      // Setup
      const token = 'invalid-token';
      const error = new Error('Token expired');
      mockTokenService.verifyAccessToken.mockRejectedValue(error);

      // Test
      const result = await service.verifyToken(token);

      // Verify
      expect(result).toEqual({
        valid: false,
        message: 'Token expired',
      });
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockDb.query.users.findFirst).not.toHaveBeenCalled();
    });

    it('should return valid=false when user does not exist', async () => {
      // Setup
      const token = 'valid-token-nonexistent-user';
      const payload = { sub: 'nonexistent-user', iat: 1626361234, exp: 1626364834 };
      mockTokenService.verifyAccessToken.mockResolvedValue(payload);
      mockDb.query.users.findFirst.mockResolvedValue(null);

      // Test
      const result = await service.verifyToken(token);

      // Verify
      expect(result).toEqual({
        valid: false,
        message: 'Invalid token: User not found',
      });
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
    });
  });
});
