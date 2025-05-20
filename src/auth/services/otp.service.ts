import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { otps } from '../../database/schema/auth.schema';

@Injectable()
export class OtpService {
  constructor(private readonly drizzle: DrizzleService) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createEmailVerificationOtp(userId: string, email: string) {
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete existing OTP for this user
    await this.drizzle.db.delete(otps).where(and(eq(otps.userId, userId), eq(otps.type, 'email_verification')));

    await this.drizzle.db.insert(otps).values({
      type: 'email_verification',
      userId,
      email,
      otp: hashedOtp,
      expiresAt,
    });

    return otp; // Return plain OTP for email sending
  }

  async verifyEmailOtp(userId: string, email: string, plainOtp: string) {
    const verificationOtp = await this.drizzle.db.query.otps.findFirst({
      where: and(
        eq(otps.type, 'email_verification'),
        eq(otps.userId, userId),
        eq(otps.email, email),
        eq(otps.isUsed, false),
      ),
    });

    if (!verificationOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (new Date() > verificationOtp.expiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    const isOtpValid = await bcrypt.compare(plainOtp, verificationOtp.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as used
    await this.drizzle.db.update(otps).set({ isUsed: true }).where(eq(otps.id, verificationOtp.id));

    return true;
  }

  async createPasswordResetOtp(email: string) {
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete existing OTP for this email
    await this.drizzle.db.delete(otps).where(and(eq(otps.email, email.toLowerCase()), eq(otps.type, 'password_reset')));

    await this.drizzle.db.insert(otps).values({
      type: 'password_reset',
      email: email.toLowerCase(),
      otp: hashedOtp,
      expiresAt,
    });

    return otp; // Return plain OTP for email sending
  }

  async verifyPasswordResetOtp(email: string, plainOtp: string) {
    const resetOtp = await this.drizzle.db.query.otps.findFirst({
      where: and(eq(otps.type, 'password_reset'), eq(otps.email, email.toLowerCase()), eq(otps.isUsed, false)),
    });

    if (!resetOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (new Date() > resetOtp.expiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    const isOtpValid = await bcrypt.compare(plainOtp, resetOtp.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as used
    await this.drizzle.db.update(otps).set({ isUsed: true }).where(eq(otps.id, resetOtp.id));

    return true;
  }
}
