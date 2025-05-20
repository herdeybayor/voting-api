import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, otp: string) {
    const appName = this.configService.get('APP_NAME', 'Voting API');
    await this.mailerService.sendMail({
      to: email,
      subject: `Verify your ${appName} account`,
      template: 'verification',
      context: {
        appName,
        email,
        otp,
        validityInMinutes: 15,
      },
    });
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const subject = 'Reset Your Password';
    const text = `Your password reset OTP is: ${otp}. This code will expire in 15 minutes.`;
    const html = `
      <h1>Reset Your Password</h1>
      <p>You have requested to reset your password. Use the following OTP to proceed:</p>
      <h2 style="font-size: 24px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">${otp}</h2>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    `;

    await this.mailerService.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    const appName = this.configService.get('APP_NAME', 'Voting API');
    await this.mailerService.sendMail({
      to: email,
      subject: `Welcome to ${appName}!`,
      template: 'welcome',
      context: {
        appName,
        name,
      },
    });
  }
}
