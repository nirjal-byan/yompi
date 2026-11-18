import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { LOGIN_LINK_TTL_MINUTES } from '@yompi/shared';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'localhost',
      port: Number(config.get<string>('SMTP_PORT') ?? 1025),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user ? { user, pass: config.get<string>('SMTP_PASSWORD') } : undefined,
    });
    this.from = config.get<string>('MAIL_FROM') ?? 'YOMPI <no-reply@yompi.local>';
  }

  async sendLoginLink(to: string, name: string, link: string): Promise<void> {
    const subject = 'Your YOMPI sign-in link';
    const text =
      `Hi ${name},\n\nUse this link to sign in to YOMPI:\n${link}\n\n` +
      `It expires in ${LOGIN_LINK_TTL_MINUTES} minutes and works once. ` +
      `If you did not ask for it, you can ignore this email.`;
    const html = `
<div style="font-family:Arial,sans-serif;background:#faf6ee;padding:32px;color:#3b2a26">
  <div style="max-width:480px;margin:auto;background:#fffdf8;border:1px solid #3b2a26;padding:32px">
    <h1 style="margin:0 0 12px;font-size:22px">Your adventure is waiting</h1>
    <p>Hi ${escapeHtml(name)}, tap the button to sign in to YOMPI.</p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#ffb43e;color:#3b2a26;border:1px solid #3b2a26;padding:12px 20px;text-decoration:none;font-weight:bold">Sign in to YOMPI</a>
    </p>
    <p style="font-size:13px;color:#6b625a">This link expires in ${LOGIN_LINK_TTL_MINUTES} minutes and works once. If you did not ask for it, you can ignore this email.</p>
  </div>
</div>`;

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    } catch (error) {
      // Never leak mail failures to the caller (it would reveal whether an account exists).
      this.logger.error(`Failed to send sign-in email: ${(error as Error).message}`);
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
