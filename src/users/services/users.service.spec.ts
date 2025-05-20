import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DrizzleService } from '../../database/drizzle.service';
import { users } from '../../database/schema/users.schema';
import { eq } from 'drizzle-orm';
import { NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AwsService } from 'src/aws/aws.service';
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockDb = {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    image: 'https://example.com/image.jpg',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
        {
          provide: AwsService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.id, mockUser.id),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      await expect(service.findById(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: eq(users.email, mockUser.email.toLowerCase()),
      });
    });

    it('should return null when user not found', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toBeNull();
    });
  });

  describe('updateSelf', () => {
    it('should update user without password change', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockDb.returning.mockResolvedValue([{ ...mockUser, ...updateData }]);

      const result = await service.updateSelf(mockUser.id, updateData);

      expect(result).toEqual({ ...mockUser, ...updateData });
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalledWith(eq(users.id, mockUser.id));
    });

    it('should update user with password change', async () => {
      const updateData = {
        oldPassword: 'currentPassword',
        password: 'newPassword',
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockDb.returning.mockResolvedValue([mockUser]);

      const result = await service.updateSelf(mockUser.id, updateData);

      expect(result).toEqual(mockUser);
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({
        password: 'hashedPassword',
        updatedAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException when old password is missing', async () => {
      const updateData = {
        password: 'newPassword',
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      await expect(service.updateSelf(mockUser.id, updateData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when old password is invalid', async () => {
      const updateData = {
        oldPassword: 'wrongPassword',
        password: 'newPassword',
      };

      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.updateSelf(mockUser.id, updateData)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when email is already taken', async () => {
      const updateData = {
        email: 'taken@example.com',
      };

      mockDb.query.users.findFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'otherUser' });

      await expect(service.updateSelf(mockUser.id, updateData)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSelf', () => {
    it('should soft delete user when password is valid', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockDb.returning.mockResolvedValue([{ ...mockUser, deletedAt: new Date() }]);

      const result = await service.deleteSelf(mockUser.id, 'validPassword');

      expect(result.deletedAt).toBeDefined();
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({
        deletedAt: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalledWith(eq(users.id, mockUser.id));
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.deleteSelf(mockUser.id, 'invalidPassword')).rejects.toThrow(UnauthorizedException);
    });
  });
});
