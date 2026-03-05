import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../cache/redis.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Authentication Service Unit Tests
 *
 * Tests for user registration, login, password management, and JWT handling
 */
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redis: RedisService;
  let jwt: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    role: 'AGENT',
    status: 'ACTIVE',
    level: 1,
    experiencePoints: 0,
    currentLevelXP: 0,
    department: null,
    phone: null,
    profilePictureUrl: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supervisorId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEmail', () => {
    it('should throw on invalid email', () => {
      expect(() =>
        (service as any).validateEmail('invalid'),
      ).toThrow(BadRequestException);

      expect(() =>
        (service as any).validateEmail(''),
      ).toThrow(BadRequestException);
    });

    it('should accept valid email', () => {
      expect(() =>
        (service as any).validateEmail('test@example.com'),
      ).not.toThrow();
    });
  });

  describe('validatePassword', () => {
    it('should throw on short password', () => {
      expect(() =>
        (service as any).validatePassword('short'),
      ).toThrow(BadRequestException);
    });

    it('should throw if no uppercase', () => {
      expect(() =>
        (service as any).validatePassword(
          'lowercase123!',
        ),
      ).toThrow(BadRequestException);
    });

    it('should throw if no lowercase', () => {
      expect(() =>
        (service as any).validatePassword(
          'UPPERCASE123!',
        ),
      ).toThrow(BadRequestException);
    });

    it('should throw if no number', () => {
      expect(() =>
        (service as any).validatePassword(
          'NoNumber!',
        ),
      ).toThrow(BadRequestException);
    });

    it('should accept valid password', () => {
      expect(() =>
        (service as any).validatePassword(
          'ValidPassword123',
        ),
      ).not.toThrow();
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password hash from user object', () => {
      const result = (service as any).sanitizeUser(mockUser);

      expect(result.passwordHash).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });
  });

  describe('getExpirySeconds', () => {
    it('should convert hours to seconds', () => {
      const result = (service as any).getExpirySeconds('24h');
      expect(result).toBe(24 * 3600);
    });

    it('should convert days to seconds', () => {
      const result = (service as any).getExpirySeconds('7d');
      expect(result).toBe(7 * 86400);
    });

    it('should convert minutes to seconds', () => {
      const result = (service as any).getExpirySeconds('60m');
      expect(result).toBe(60 * 60);
    });

    it('should return 24h default for invalid format', () => {
      const result = (service as any).getExpirySeconds(
        'invalid',
      );
      expect(result).toBe(86400);
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(null);

      await expect(
        service.login('notfound@example.com', 'Password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      await expect(
        service.login('test@example.com', 'WrongPassword123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not active', async () => {
      const inactiveUser = {
        ...mockUser,
        status: 'SUSPENDED',
      };

      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(inactiveUser as any);

      await expect(
        service.login('test@example.com', 'Password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and tokens on successful login', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      jest.spyOn(prisma.user, 'update').mockResolvedValue(
        mockUser as any,
      );

      jest.spyOn(jwt, 'sign').mockReturnValue('token');

      const result = await service.login(
        'test@example.com',
        'Password123',
      );

      expect(result.user).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('token');
    });
  });

  describe('validateToken', () => {
    it('should throw if token is blacklisted', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue('true');

      await expect(
        service.validateToken('blacklisted-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token expired', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue(null);

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      await expect(
        service.validateToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token invalid', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue(null);

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Invalid token');
        (error as any).name = 'JsonWebTokenError';
        throw error;
      });

      await expect(
        service.validateToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return payload for valid token', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue(null);

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'AGENT',
        type: 'access',
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(payload as any);

      const result = await service.validateToken('valid-token');

      expect(result).toEqual(payload);
    });
  });

  describe('logout', () => {
    it('should add token to blacklist', async () => {
      jest.spyOn(jwt, 'decode').mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as any);

      await service.logout('token-to-revoke');

      expect(redis.set).toHaveBeenCalled();
    });

    it('should throw on invalid token', async () => {
      jest.spyOn(jwt, 'decode').mockReturnValue(null);

      await expect(
        service.logout('invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
