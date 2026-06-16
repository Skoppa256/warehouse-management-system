import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  // Resend's constructor throws when the key is empty, which would crash the app
  // on boot. Email is optional, so only initialise the client when a key is set.
  private readonly resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  async sendVerificationEmail(email: string, code: string) {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not configured — skipping verification email to ${email}.`,
      );
      return;
    }
    await this.resend.emails.send({
      from: 'XStock <onboarding@resend.dev>',
      to: email,
      subject: 'Your XStock Verification Code',
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size:32px">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    });
  }
}
