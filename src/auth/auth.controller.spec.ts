import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { VerifyTokenDto } from './dto/auth.dto';
import { AuthService } from './services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should call authService.verifyToken with the token from the DTO', async () => {
      // Setup
      const verifyTokenDto: VerifyTokenDto = {
        accessToken: 'test-access-token',
      };

      const expectedResult = {
        valid: true,
        payload: {
          sub: 'user123',
          iat: 1626361234,
          exp: 1626364834,
        },
      };

      mockAuthService.verifyToken.mockResolvedValue(expectedResult);

      // Test
      const result = await controller.verifyToken(verifyTokenDto);

      // Verify
      expect(result).toEqual(expectedResult);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(verifyTokenDto.accessToken);
    });

    it('should return valid=false when token verification fails', async () => {
      // Setup
      const verifyTokenDto: VerifyTokenDto = {
        accessToken: 'invalid-token',
      };

      const expectedResult = {
        valid: false,
        message: 'Token expired',
      };

      mockAuthService.verifyToken.mockResolvedValue(expectedResult);

      // Test
      const result = await controller.verifyToken(verifyTokenDto);

      // Verify
      expect(result).toEqual(expectedResult);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(verifyTokenDto.accessToken);
    });
  });
});
