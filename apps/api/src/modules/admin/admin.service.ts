import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../../common/audit/audit.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(params: { role?: string; page: number; pageSize: number }) {
    const where = params.role ? { role: params.role.toUpperCase() as any } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, fullName: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async setUserStatus(
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
    reason: string | undefined,
    actor: { userId: string; role: string },
  ) {
    const before = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!before) throw new NotFoundException("User not found");

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data: { status } });
      if (user.role === "PLUMBER") {
        await tx.plumberProfile.updateMany({
          where: { userId },
          data: { isSuspended: status === "SUSPENDED", suspensionReason: status === "SUSPENDED" ? reason : null },
        });
      }
      return user;
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "user.status_changed",
      targetType: "User",
      targetId: userId,
      beforeJson: { status: before.status },
      afterJson: { status },
      reason,
    });

    return updated;
  }

  async dashboard() {
    const [
      totalUsers,
      activeCustomers,
      pendingApplications,
      approvedPlumbers,
      onlinePlumbers,
      requestsByStatus,
      openDisputes,
      invoiceAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.customerProfile.count(),
      this.prisma.plumberProfile.count({ where: { approvalStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      this.prisma.plumberProfile.count({ where: { approvalStatus: "APPROVED" } }),
      this.prisma.plumberProfile.count({ where: { isOnline: true } }),
      this.prisma.serviceRequest.groupBy({ by: ["status"], _count: true }),
      this.prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      this.prisma.invoice.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true, commissionCents: true, plumberPayoutCents: true },
        _count: true,
      }),
    ]);

    const totalRequests = requestsByStatus.reduce((sum, r) => sum + r._count, 0);
    const cancelled = requestsByStatus.find((r) => r.status === "CANCELLED")?._count ?? 0;

    return {
      totalUsers,
      activeCustomers,
      pendingPlumberApplications: pendingApplications,
      approvedPlumbers,
      onlinePlumbers,
      requestsByStatus,
      totalRequests,
      cancellationRatePercent: totalRequests > 0 ? Math.round((cancelled / totalRequests) * 100) : 0,
      openDisputes,
      grossTransactionValueCents: invoiceAgg._sum.totalCents ?? 0,
      platformRevenueCents: invoiceAgg._sum.commissionCents ?? 0,
      plumberPayoutsCents: invoiceAgg._sum.plumberPayoutCents ?? 0,
      paidInvoiceCount: invoiceAgg._count,
    };
  }

  async auditLog(params: { page: number; pageSize: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
