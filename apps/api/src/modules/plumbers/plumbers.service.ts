import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PlumbersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public "Browse plumbers" listing — only approved, non-suspended plumbers. */
  async browsePublic(params: { categorySlug?: string; page: number; pageSize: number }) {
    const where: any = { approvalStatus: "APPROVED", isSuspended: false };
    if (params.categorySlug) {
      where.services = { some: { category: { slug: params.categorySlug }, active: true } };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.plumberProfile.findMany({
        where,
        include: {
          user: { select: { fullName: true, profilePhotoMediaId: true } },
          business: true,
          services: { include: { category: true }, where: { active: true } },
        },
        orderBy: { averageRating: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.plumberProfile.count({ where }),
    ]);
    return { items: items.map(this.toPublicProfile), total, page: params.page, pageSize: params.pageSize };
  }

  async getPublicProfile(id: string) {
    const plumber = await this.prisma.plumberProfile.findFirst({
      where: { id, approvalStatus: "APPROVED" },
      include: {
        user: { select: { fullName: true, profilePhotoMediaId: true } },
        business: true,
        services: { include: { category: true }, where: { active: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            overallRating: true,
            comment: true,
            createdAt: true,
            isVerifiedBooking: true,
            isDemoData: true,
            plumberResponse: true,
          },
        },
      },
    });
    if (!plumber) return null;
    return this.toPublicProfile(plumber);
  }

  private toPublicProfile(p: any) {
    return {
      id: p.id,
      name: p.user.fullName,
      businessName: p.business?.businessName,
      biography: p.biography,
      yearsExperience: p.yearsExperience,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      isOnline: p.isOnline,
      categories: p.services?.map((s: any) => s.category.name) ?? [],
      reviews: p.reviews,
      verified: true, // only APPROVED profiles reach this method
    };
  }

  /**
   * Required before assigning a plumber to any job (manual or automatic
   * dispatch): approved, not suspended, and no expired license/insurance
   * document. See docs/architecture.md — "Automatically prevent new-job
   * acceptance when required documentation expires."
   */
  async isEligibleForNewJobs(plumberProfileId: string): Promise<{ eligible: boolean; reason?: string }> {
    const plumber = await this.prisma.plumberProfile.findUnique({
      where: { id: plumberProfileId },
      include: { licenses: true, insuranceDocuments: true },
    });
    if (!plumber) return { eligible: false, reason: "Plumber not found" };
    if (plumber.approvalStatus !== "APPROVED") return { eligible: false, reason: "Plumber is not approved" };
    if (plumber.isSuspended) return { eligible: false, reason: "Plumber is suspended" };

    const now = new Date();
    const hasExpiredLicense = plumber.licenses.some((l) => l.status === "APPROVED" && l.expiresOn < now);
    const hasExpiredInsurance = plumber.insuranceDocuments.some((i) => i.status === "APPROVED" && i.expiresOn < now);
    if (hasExpiredLicense) return { eligible: false, reason: "Plumbing license has expired" };
    if (hasExpiredInsurance) return { eligible: false, reason: "Insurance document has expired" };

    return { eligible: true };
  }
}
