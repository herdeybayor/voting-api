import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '../../database/drizzle.service';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/common/interfaces/env';
import ms from 'ms';
import { AuthResponseDto, RegisterDto } from '../dto/auth.dto';
import { MailService } from '../../mail/mail.service';
import { OtpService } from './otp.service';
import { UniqueConstraintViolationException } from '../../common/exceptions/database.exception';
import { PostgresErrorCode } from '../../common/exceptions/postgres-error-code.enum';
import { refreshTokens, users } from 'src/database/schema';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const [user] = await this.drizzle.db
        .insert(users)
        .values({
          email: registerDto.email.toLowerCase(),
          password: hashedPassword,
          firstName: registerDto.firstName || '',
          lastName: registerDto.lastName || '',
        })
        .returning();

      this.logger.log(`User registered successfully: ${user.id}`);

      // Generate and send OTP for email verification
      const otp = await this.otpService.createEmailVerificationOtp(user.id, user.email);
      await this.mailService.sendVerificationEmail(user.email, otp);
      this.logger.debug(`Verification email sent to: ${user.email}`);

      const tokens = await this.generateTokens(user.id);
      return { user, tokens };
    } catch (error) {
      if (error.code === PostgresErrorCode.UNIQUE_VIOLATION && error.constraint === 'users_email_unique') {
        this.logger.warn(`Registration failed: Email ${registerDto.email} already exists`);
        throw new UniqueConstraintViolationException('email');
      }
      this.logger.error({
        message: `Registration failed for email: ${registerDto.email}`,
        error,
      });
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${email}`);

    try {
      const user = await this.validateUser(email, password);
      const tokens = await this.generateTokens(user.id);

      this.logger.log(`User logged in successfully: ${user.id}`);
      return { user, tokens };
    } catch (error) {
      this.logger.warn({
        message: `Login failed for email: ${email}`,
        error: error.message,
      });
      throw error;
    }
  }

  async verifyEmail(userId: string, email: string, otp: string) {
    this.logger.debug(`Email verification attempt for user: ${userId}`);

    try {
      await this.otpService.verifyEmailOtp(userId, email, otp);
      const [user] = await this.drizzle.db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, userId))
        .returning();

      await this.mailService.sendWelcomeEmail(email, user.firstName || '');

      this.logger.log(`Email verified successfully for user: ${userId}`);
      return { message: 'Email verified successfully' };
    } catch (error) {
      this.logger.error({
        message: `Email verification failed for user: ${userId}`,
        error,
      });
      throw error;
    }
  }

  async resendVerificationEmail(userId: string, email: string) {
    this.logger.debug(`Resending verification email for user: ${userId}`);

    try {
      const otp = await this.otpService.createEmailVerificationOtp(userId, email);
      await this.mailService.sendVerificationEmail(email, otp);

      this.logger.log(`Verification email resent to: ${email}`);
      return { message: 'Verification code sent' };
    } catch (error) {
      this.logger.error({
        message: `Failed to resend verification email for user: ${userId}`,
        error,
      });
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    this.logger.debug(`Attempting to validate user with email: ${email}`);

    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      this.logger.warn(`Login attempt failed: User not found for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: Invalid password for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User ${email} successfully validated`);
    return user;
  }

  async generateTokens(userId: string) {
    this.logger.debug(`Generating tokens for user: ${userId}`);

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync({ sub: userId }),
        this.generateRefreshToken(userId),
      ]);

      this.logger.log(`Tokens generated successfully for user: ${userId}`);
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error({
        message: `Failed to generate tokens for user: ${userId}`,
        error,
      });
      throw error;
    }
  }

  private async generateRefreshToken(userId: string) {
    this.logger.debug(`Generating refresh token for user: ${userId}`);

    try {
      const refreshExpiration = this.configService.getOrThrow('JWT_REFRESH_EXPIRATION');
      const token = await this.jwtService.signAsync({ sub: userId }, { expiresIn: refreshExpiration });

      await this.drizzle.db.insert(refreshTokens).values({
        token,
        userId,
        expiresAt: new Date(Date.now() + ms(refreshExpiration)),
      });

      this.logger.debug(`Refresh token generated and stored for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error({
        message: `Failed to generate refresh token for user: ${userId}`,
        error,
      });
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    this.logger.debug('Attempting to refresh access token');

    try {
      const token = await this.drizzle.db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.token, refreshToken),
      });

      if (!token || token.revoked || new Date() > token.expiresAt) {
        this.logger.warn('Refresh token invalid or expired');
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = await this.jwtService.signAsync({
        sub: token.userId,
      });
      this.logger.log(`Access token refreshed for user: ${token.userId}`);
      return { accessToken };
    } catch (error) {
      this.logger.warn({
        message: 'Token refresh failed',
        error: error.message,
      });
      throw error;
    }
  }

  async revokeRefreshToken(token: string) {
    this.logger.debug('Attempting to revoke refresh token');

    try {
      await this.drizzle.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.token, token));

      this.logger.log('Refresh token successfully revoked');
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error({
        message: 'Failed to revoke refresh token',
        error,
      });
      throw error;
    }
  }

  async requestPasswordReset(email: string) {
    this.logger.log(`Password reset requested for email: ${email}`);

    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      this.logger.warn(`Password reset failed: User not found for email ${email}`);
      throw new NotFoundException('User not found');
    }

    // Generate and send OTP
    const otp = await this.otpService.createPasswordResetOtp(email);
    await this.mailService.sendPasswordResetEmail(email, otp);

    this.logger.debug(`Password reset OTP sent to: ${email}`);
    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    this.logger.debug(`Resetting password for: ${email}`);

    try {
      const verified = await this.otpService.verifyPasswordResetOtp(email, otp);
      if (!verified) {
        throw new UnauthorizedException('Invalid OTP');
      }

      const user = await this.drizzle.db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await this.drizzle.db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));

      this.logger.log(`Password reset successful for user: ${user.id}`);
      return { message: 'Password reset successful' };
    } catch (error) {
      this.logger.warn({
        message: `Password reset failed for email: ${email}`,
        error: error.message,
      });
      throw error;
    }
  }

  async verifyToken(token: string) {
    this.logger.debug('Verifying access token');

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      // Fetch user to ensure they exist
      const user = await this.drizzle.db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token: User not found');
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      this.logger.warn({
        message: 'Token verification failed',
        error: error.message,
      });

      return {
        valid: false,
        message: error.message || 'Invalid token',
      };
    }
  }

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
