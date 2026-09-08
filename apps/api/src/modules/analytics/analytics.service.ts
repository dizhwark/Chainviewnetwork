import { Injectable } from "@nestjs/common";
import { AnalyticsEventName, sanitizeAnalyticsProperties } from "@maybe/shared";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(
    eventName: AnalyticsEventName,
    rawProperties: Record<string, unknown> = {},
    context: { userId?: string; sessionId?: string; isDemoData?: boolean } = {},
  ): Promise<void> {
    const properties = sanitizeAnalyticsProperties(rawProperties);
    await this.prisma.analyticsEvent.create({
      data: {
        eventName,
        userId: context.userId,
        sessionId: context.sessionId,
        properties: properties as any,
        isDemoData: context.isDemoData ?? false,
      },
    });
  }
}
