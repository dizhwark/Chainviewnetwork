import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { BRAND } from "@maybe/config";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email provider abstraction. EMAIL_PROVIDER=console (default) logs the
 * email instead of sending — a safe, fully-functional dev fallback that
 * never silently pretends to have delivered mail. Set EMAIL_PROVIDER=smtp
 * and the SMTP_* vars to send through a real provider (Postmark/SendGrid/
 * SES all speak SMTP).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger("EmailService");
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.EMAIL_PROVIDER === "smtp") {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
    }
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `[DEV FALLBACK] EMAIL_PROVIDER=console — not actually sending email. ` +
          `To: ${message.to} | Subject: ${message.subject}\n${message.text}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS ?? `${BRAND.name} <no-reply@maybe.example>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
