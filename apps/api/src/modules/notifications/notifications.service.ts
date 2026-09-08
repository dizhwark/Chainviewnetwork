import { Injectable, Logger } from "@nestjs/common";
import { NotificationChannel } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EmailService } from "./email.service";

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  email?: string;
  /** Unique per (userId, event) to prevent duplicate notifications for the same event. */
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger("NotificationsService");

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Writes an in-app notification (deduped) and, if an email is given, sends it too. */
  async notify(input: NotifyInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          channel: NotificationChannel.IN_APP,
          dedupeKey: input.dedupeKey,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        this.logger.debug(`Skipped duplicate notification for dedupeKey=${input.dedupeKey}`);
      } else {
        throw err;
      }
    }

    if (input.email) {
      await this.emailService.send({ to: input.email, subject: input.title, text: input.body });
    }
  }
}
