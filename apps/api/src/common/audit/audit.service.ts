import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface WriteAuditLogInput {
  actorUserId?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** Append-only. There is deliberately no update/delete method on this service. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: WriteAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson: input.beforeJson as any,
        afterJson: input.afterJson as any,
        reason: input.reason,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}
