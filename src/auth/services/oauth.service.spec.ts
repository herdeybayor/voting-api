import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { DrizzleService } from '../../database/drizzle.service';
import { oauthAccounts } from '../../database/schema/auth.schema';
import { users } from '../../database/schema/users.schema';
import { and, eq } from 'drizzle-orm';
import { NotFoundException } from '@nestjs/common';
describe('OAuthService', () => {
  let service: OAuthService;

  const mockDb = {
    query: {
      oauthAccounts: {
        findFirst: jest.fn(),
      },
      users: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  const mockProfile = {
    id: 'oauth123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    image: 'https://example.com/image.jpg',
  };

  const mockTokens = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    expiresAt: new Date(Date.now() + 3600000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOAuthLogin', () => {
    describe('when OAuth account exists', () => {
      it('should update tokens and return existing user', async () => {
        const existingOAuthAccount = {
          userId: 'user123',
          provider: 'google',
          providerId: mockProfile.id,
        };

        const existingUser = {
          id: 'user123',
          email: mockProfile.email,
          firstName: mockProfile.firstName,
          lastName: mockProfile.lastName,
        };

        mockDb.query.oauthAccounts.findFirst.mockResolvedValue(existingOAuthAccount);
        mockDb.query.users.findFirst.mockResolvedValue(existingUser);

        const result = await service.handleOAuthLogin('google', mockProfile, mockTokens);

        expect(result).toEqual(existingUser);
        expect(mockDb.update).toHaveBeenCalledWith(oauthAccounts);
        expect(mockDb.set).toHaveBeenCalledWith({
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          tokenExpiresAt: mockTokens.expiresAt,
        });
        expect(mockDb.where).toHaveBeenCalledWith(
          and(eq(oauthAccounts.userId, existingOAuthAccount.userId), eq(oauthAccounts.provider, 'google')),
        );
      });
    });

    describe('when OAuth account does not exist but user exists', () => {
      it('should create OAuth account and return existing user', async () => {
        const existingUser = {
          id: 'user123',
          email: mockProfile.email,
          firstName: mockProfile.firstName,
          lastName: mockProfile.lastName,
        };

        mockDb.query.oauthAccounts.findFirst.mockResolvedValue(null);
        mockDb.query.users.findFirst.mockResolvedValue(existingUser);
        mockDb.insert.mockReturnThis();
        mockDb.returning.mockResolvedValue([{}]);

        const result = await service.handleOAuthLogin('google', mockProfile, mockTokens);

        expect(result).toEqual(existingUser);
        expect(mockDb.insert).toHaveBeenCalledWith(oauthAccounts);
        expect(mockDb.values).toHaveBeenCalledWith({
          userId: existingUser.id,
          provider: 'google',
          providerId: mockProfile.id,
          email: mockProfile.email,
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          tokenExpiresAt: mockTokens.expiresAt,
        });
      });
    });

    describe('when neither OAuth account nor user exists', () => {
      it('should create new user and OAuth account', async () => {
        const newUser = {
          id: 'newuser123',
          email: mockProfile.email,
          firstName: mockProfile.firstName,
          lastName: mockProfile.lastName,
        };

        mockDb.query.oauthAccounts.findFirst.mockResolvedValue(null);
        mockDb.query.users.findFirst.mockResolvedValue(null);
        mockDb.insert.mockReturnThis();
        mockDb.returning.mockResolvedValueOnce([newUser]).mockResolvedValueOnce([{}]);

        const result = await service.handleOAuthLogin('google', mockProfile, mockTokens);

        expect(result).toEqual(newUser);
        expect(mockDb.insert).toHaveBeenCalledWith(users);
        expect(mockDb.values).toHaveBeenCalledWith({
          email: mockProfile.email.toLowerCase(),
          firstName: mockProfile.firstName,
          lastName: mockProfile.lastName,
          image: mockProfile.image,
          password: '',
          isEmailVerified: true,
        });
        expect(mockDb.insert).toHaveBeenCalledWith(oauthAccounts);
        expect(mockDb.values).toHaveBeenCalledWith({
          userId: newUser.id,
          provider: 'google',
          providerId: mockProfile.id,
          email: mockProfile.email,
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          tokenExpiresAt: mockTokens.expiresAt,
        });
      });
    });

    describe('when OAuth account exists but user is not found', () => {
      it('should throw an error', async () => {
        const existingOAuthAccount = {
          userId: 'user123',
          provider: 'google',
          providerId: mockProfile.id,
        };

        mockDb.query.oauthAccounts.findFirst.mockResolvedValue(existingOAuthAccount);
        mockDb.query.users.findFirst.mockResolvedValue(null);

        await expect(service.handleOAuthLogin('google', mockProfile, mockTokens)).rejects.toThrow(NotFoundException);
      });
    });
  });
});
