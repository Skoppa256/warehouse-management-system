import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, code: string) {
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
