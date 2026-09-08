import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { PlumberApprovalStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../../common/audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreatePlumberApplicationDto, ApplicationDecisionDto } from "./dto/plumber-application.dto";

const BUSINESS_TYPE_MAP: Record<string, "SOLE_PROPRIETOR" | "PARTNERSHIP" | "CORPORATION"> = {
  sole_proprietor: "SOLE_PROPRIETOR",
  partnership: "PARTNERSHIP",
  corporation: "CORPORATION",
};

const DECISION_MAP: Record<string, PlumberApprovalStatus> = {
  approved: PlumberApprovalStatus.APPROVED,
  rejected: PlumberApprovalStatus.REJECTED,
  more_info_required: PlumberApprovalStatus.MORE_INFO_REQUIRED,
};

@Injectable()
export class PlumberApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreatePlumberApplicationDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException("An account with this email already exists");

    const categories = await this.prisma.serviceCategory.findMany({ where: { slug: { in: dto.categorySlugs } } });
    if (categories.length !== dto.categorySlugs.length) {
      throw new BadRequestException("One or more selected service categories are invalid");
    }

    const zones = await this.prisma.serviceZone.findMany({ where: { active: true } });
    const passwordHash = await argon2.hash(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const business = await tx.plumbingBusiness.create({
        data: {
          legalName: dto.legalName,
          businessName: dto.businessName,
          businessType: BUSINESS_TYPE_MAP[dto.businessType],
          hstNumber: dto.hstNumber || undefined,
          addressLine1: dto.businessAddress.line1,
          addressLine2: dto.businessAddress.line2,
          city: dto.businessAddress.city,
          province: dto.businessAddress.province ?? "ON",
          postalCode: dto.businessAddress.postalCode,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          fullName: dto.legalName,
          passwordHash,
          role: UserRole.PLUMBER,
        },
      });

      const plumberProfile = await tx.plumberProfile.create({
        data: {
          userId: user.id,
          businessId: business.id,
          biography: dto.biography,
          yearsExperience: dto.yearsExperience,
          approvalStatus: PlumberApprovalStatus.SUBMITTED,
          licenses: {
            create: {
              licenseNumber: dto.licenseNumber,
              licenseType: dto.licenseType,
              issuingAuthority: dto.licenseIssuingAuthority,
              expiresOn: new Date(dto.licenseExpiresOn),
              documentMediaId: dto.licenseDocumentMediaId,
              status: PlumberApprovalStatus.SUBMITTED,
            },
          },
          insuranceDocuments: {
            create: {
              provider: dto.insuranceProvider,
              policyNumber: dto.insurancePolicyNumber,
              coverageAmountCents: dto.insuranceCoverageAmountCents,
              expiresOn: new Date(dto.insuranceExpiresOn),
              documentMediaId: dto.insuranceDocumentMediaId,
              status: PlumberApprovalStatus.SUBMITTED,
            },
          },
          services: {
            create: categories.map((c) => ({ categoryId: c.id })),
          },
          serviceAreas: {
            create: zones
              .filter((z) => z.postalPrefixes.some((p) => dto.serviceAreaPostalPrefixes.includes(p)))
              .map((z) => ({ serviceZoneId: z.id, radiusKmOverride: dto.serviceRadiusKm })),
          },
        },
      });

      return { user, plumberProfile };
    });

    await this.notifications.notify({
      userId: result.user.id,
      type: "application_submitted",
      title: "Application received",
      body: `Thanks for applying to join as a plumber! We'll review your license and insurance documents and follow up within a few business days.`,
      email: dto.email,
      dedupeKey: "application_submitted",
    });

    return { plumberProfileId: result.plumberProfile.id, status: result.plumberProfile.approvalStatus };
  }

  async adminList(params: { status?: string; page: number; pageSize: number }) {
    const where = params.status ? { approvalStatus: params.status.toUpperCase() as PlumberApprovalStatus } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.plumberProfile.findMany({
        where,
        include: { user: true, business: true, licenses: true, insuranceDocuments: true },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.plumberProfile.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async adminGet(id: string) {
    const profile = await this.prisma.plumberProfile.findUnique({
      where: { id },
      include: {
        user: true,
        business: true,
        licenses: true,
        insuranceDocuments: true,
        services: { include: { category: true } },
        serviceAreas: { include: { serviceZone: true } },
        verificationReviews: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!profile) throw new NotFoundException("Application not found");
    return profile;
  }

  async decide(id: string, dto: ApplicationDecisionDto, actor: { userId: string; role: string }) {
    const before = await this.prisma.plumberProfile.findUnique({ where: { id }, include: { user: true } });
    if (!before) throw new NotFoundException("Application not found");

    const newStatus = DECISION_MAP[dto.decision];

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.plumberProfile.update({ where: { id }, data: { approvalStatus: newStatus } });
      await tx.verificationReview.create({
        data: { plumberProfileId: id, reviewerUserId: actor.userId, decision: newStatus, reason: dto.reason },
      });
      return p;
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "plumber_application.decision",
      targetType: "PlumberProfile",
      targetId: id,
      beforeJson: { approvalStatus: before.approvalStatus },
      afterJson: { approvalStatus: updated.approvalStatus },
      reason: dto.reason,
    });

    const messages: Record<string, string> = {
      approved: "Congratulations — your plumber application has been approved! You can now configure your services and start receiving requests.",
      rejected: `Your plumber application was not approved.${dto.reason ? ` Reason: ${dto.reason}` : ""}`,
      more_info_required: `We need more information to continue reviewing your application.${dto.reason ? ` ${dto.reason}` : ""}`,
    };

    await this.notifications.notify({
      userId: before.user.id,
      type: dto.decision === "approved" ? "application_approved" : "application_status_changed",
      title: "Update on your plumber application",
      body: messages[dto.decision],
      email: before.user.email,
    });

    return updated;
  }
}
