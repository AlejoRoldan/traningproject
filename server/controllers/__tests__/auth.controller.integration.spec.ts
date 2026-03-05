import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/user/auth.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';
import { AuthResponseDto } from '../../dtos/auth.dto';

/**
 * Authentication Controller Integration Tests
 *
 * Tests for authentication endpoints and request/response flows
 */
describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthResponse: AuthResponseDto = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'AGENT',
      status: 'ACTIVE',
    },
    tokens: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: {
              register: jest.fn(),
              login: jest.fn(),
              validateToken: jest.fn(),
              refreshToken: jest.fn(),
              logout: jest.fn(),
              changePassword: jest.fn(),
              requestPasswordReset: jest.fn(),
              resetPassword: jest.fn(),
              getUserById: jest.fn(),
            },
          },
          {
            provide: JwtGuard,
            useValue: {
              canActivate: jest.fn(() => true),
            },
          },
        ],
      }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register new user with valid data', () => {
      jest
        .spyOn(authService, 'register')
        .mockResolvedValue(mockAuthResponse);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'StrongPassword123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.tokens).toBeDefined();
          expect(res.body.tokens.accessToken).toBeDefined();
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          name: 'New User',
          password: 'StrongPassword123',
        })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'short',
        })
        .expect(400);
    });

    it('should reject duplicate email', () => {
      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(
          new Error('User with this email already exists'),
        );

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          name: 'Test User',
          password: 'StrongPassword123',
        })
        .expect(500);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', () => {
      jest
        .spyOn(authService, 'login')
        .mockResolvedValue(mockAuthResponse);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.tokens.accessToken).toBeDefined();
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'StrongPassword123',
        })
        .expect(400);
    });

    it('should reject missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new access token', () => {
      const tokenResponse = {
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
      };

      jest
        .spyOn(authService, 'refreshToken')
        .mockResolvedValue(tokenResponse);

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBe(
            'new-access-token',
          );
          expect(res.body.tokenType).toBe('Bearer');
        });
    });

    it('should reject invalid refresh token', () => {
      jest
        .spyOn(authService, 'refreshToken')
        .mockRejectedValue(
          new Error('Invalid refresh token'),
        );

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(500);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user', () => {
      jest.spyOn(authService, 'logout').mockResolvedValue();

      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer token')
        .send({
          token: 'user-token',
        })
        .expect(200);
    });
  });

  describe('POST /auth/password/change', () => {
    it('should change password with correct current password', () => {
      jest
        .spyOn(authService, 'changePassword')
        .mockResolvedValue();

      return request(app.getHttpServer())
        .post('/auth/password/change')
        .set('Authorization', 'Bearer token')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(200);
    });

    it('should reject weak new password', () => {
      return request(app.getHttpServer())
        .post('/auth/password/change')
        .set('Authorization', 'Bearer token')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /auth/password/reset-request', () => {
    it('should send password reset email', () => {
      jest
        .spyOn(authService, 'requestPasswordReset')
        .mockResolvedValue('reset-token');

      return request(app.getHttpServer())
        .post('/auth/password/reset-request')
        .send({
          email: 'test@example.com',
        })
        .expect(200);
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/password/reset-request')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /auth/password/reset', () => {
    it('should reset password with valid token', () => {
      jest
        .spyOn(authService, 'resetPassword')
        .mockResolvedValue();

      return request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({
          resetToken: 'valid-reset-token',
          newPassword: 'NewPassword123',
        })
        .expect(200);
    });

    it('should reject invalid reset token', () => {
      jest
        .spyOn(authService, 'resetPassword')
        .mockRejectedValue(
          new Error('Invalid reset token'),
        );

      return request(app.getHttpServer())
        .post('/auth/password/reset')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'NewPassword123',
        })
        .expect(500);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', () => {
      jest
        .spyOn(authService, 'getUserById')
        .mockResolvedValue(mockAuthResponse.user as any);

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.id).toBe('user-123');
        });
    });

    it('should reject requests without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
