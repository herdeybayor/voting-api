import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let service: TokenService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should call jwtService.signAsync with payload and options', async () => {
      // Setup
      const payload = { sub: 'user123' };
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_ACCESS_EXPIRATION') return '1h';
        return null;
      });

      // Test
      const result = await service.generateAccessToken(payload);

      // Verify
      expect(result).toEqual('mock.jwt.token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-secret',
        expiresIn: '1h',
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_EXPIRATION');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token and return payload', async () => {
      // Setup
      const token = 'valid.jwt.token';
      const decodedPayload = { sub: 'user123', iat: 1626361234, exp: 1626364834 };
      mockJwtService.verifyAsync.mockResolvedValue(decodedPayload);
      mockConfigService.get.mockReturnValue('test-secret');

      // Test
      const result = await service.verifyAccessToken(token);

      // Verify
      expect(result).toEqual(decodedPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw an error when token is invalid', async () => {
      // Setup
      const token = 'invalid.jwt.token';
      const error = new Error('Invalid token');
      mockJwtService.verifyAsync.mockRejectedValue(error);
      mockConfigService.get.mockReturnValue('test-secret');

      // Test & Verify
      await expect(service.verifyAccessToken(token)).rejects.toThrow(error);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
    });
  });

  describe('decodeToken', () => {
    it('should decode a token', () => {
      // Setup
      const token = 'encoded.jwt.token';
      const decodedPayload = { sub: 'user123', iat: 1626361234, exp: 1626364834 };
      mockJwtService.decode.mockReturnValue(decodedPayload);

      // Test
      const result = service.decodeToken(token);

      // Verify
      expect(result).toEqual(decodedPayload);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
    });
  });
});
