import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ServiceRequestStatus, Urgency } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GeocodingService } from "../geocoding/geocoding.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../notifications/email.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { AuditService } from "../../common/audit/audit.service";
import { PlumbersService } from "../plumbers/plumbers.service";
import { CreateServiceRequestDto, UpdateServiceRequestStatusDto } from "./dto/service-request.dto";

const STATUS_MAP: Record<string, ServiceRequestStatus> = {
  new: ServiceRequestStatus.NEW,
  contacted: ServiceRequestStatus.CONTACTED,
  plumber_assigned: ServiceRequestStatus.PLUMBER_ASSIGNED,
  scheduled: ServiceRequestStatus.SCHEDULED,
  in_progress: ServiceRequestStatus.IN_PROGRESS,
  completed: ServiceRequestStatus.COMPLETED,
  cancelled: ServiceRequestStatus.CANCELLED,
  no_plumber_available: ServiceRequestStatus.NO_PLUMBER_AVAILABLE,
};

const URGENCY_MAP: Record<string, Urgency> = {
  scheduled: Urgency.SCHEDULED,
  instant: Urgency.INSTANT,
  emergency: Urgency.EMERGENCY,
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
    private readonly analytics: AnalyticsService,
    private readonly audit: AuditService,
    private readonly plumbers: PlumbersService,
  ) {}

  async create(dto: CreateServiceRequestDto) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { slug: dto.categorySlug } });
    if (!category || !category.active) throw new BadRequestException("Unknown or inactive service category");

    if (dto.urgency === "emergency" && !category.emergencyEligible) {
      throw new BadRequestException("This category is not eligible for emergency requests");
    }

    const geocoded = await this.geocoding.geocode({
      line1: dto.address.line1,
      city: dto.address.city,
      province: dto.address.province ?? "ON",
      postalCode: dto.address.postalCode,
    });

    const serviceRequest = await this.prisma.serviceRequest.create({
      data: {
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        addressLine1: dto.address.line1,
        addressLine2: dto.address.line2,
        city: dto.address.city,
        province: dto.address.province ?? "ON",
        postalCode: dto.address.postalCode,
        lat: geocoded.lat,
        lng: geocoded.lng,
        categoryId: category.id,
        problemDescription: dto.problemDescription,
        urgency: URGENCY_MAP[dto.urgency],
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        marketingConsent: dto.marketingConsent ?? false,
        photos: dto.photoMediaIds?.length
          ? { create: dto.photoMediaIds.map((mediaId) => ({ mediaId })) }
          : undefined,
      },
      include: { category: true },
    });

    await this.analytics.track("request_submitted", {
      categorySlug: category.slug,
      urgency: dto.urgency,
      source: "public_form",
    });

    // Phase 1 has no per-admin in-app notification target yet (no admin accounts are
    // "subscribed" to a request) — the admin dashboard queue is the source of truth.
    // We do send the customer a confirmation with their status-lookup link.
    await this.emailService.send({
      to: dto.contactEmail,
      subject: "We received your service request",
      text:
        `Thanks ${dto.contactName}, we've received your ${category.name} request. ` +
        `Track its status any time at ${process.env.WEB_BASE_URL}/status/${serviceRequest.statusToken}`,
    });

    return {
      id: serviceRequest.id,
      statusLookupUrl: `${process.env.WEB_BASE_URL}/status/${serviceRequest.statusToken}`,
      status: serviceRequest.status,
    };
  }

  async getByStatusToken(token: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { statusToken: token },
      include: {
        category: true,
        assignedPlumberProfile: { include: { user: true } },
      },
    });
    if (!request) throw new NotFoundException("Request not found");

    return {
      status: request.status,
      category: request.category.name,
      urgency: request.urgency,
      createdAt: request.createdAt,
      assignedPlumber: request.assignedPlumberProfile
        ? { name: request.assignedPlumberProfile.user.fullName }
        : null,
      reviewUrl:
        request.status === "COMPLETED" ? `${process.env.WEB_BASE_URL}/review/${request.reviewToken}` : null,
    };
  }

  async adminList(params: { status?: string; page: number; pageSize: number }) {
    const where = params.status ? { status: STATUS_MAP[params.status] } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        include: { category: true, assignedPlumberProfile: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async adminGet(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: true,
        assignedPlumberProfile: { include: { user: true } },
        photos: true,
        notes: { orderBy: { createdAt: "desc" } },
        invoices: { include: { lineItems: true } },
        review: true,
      },
    });
    if (!request) throw new NotFoundException("Request not found");
    return request;
  }

  async updateStatus(id: string, dto: UpdateServiceRequestStatusDto, actor: { userId: string; role: string }) {
    const before = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Request not found");

    if (dto.status === "plumber_assigned" && !dto.assignedPlumberProfileId) {
      throw new BadRequestException("assignedPlumberProfileId is required for plumber_assigned status");
    }
    if (dto.assignedPlumberProfileId) {
      const eligibility = await this.plumbers.isEligibleForNewJobs(dto.assignedPlumberProfileId);
      if (!eligibility.eligible) {
        throw new BadRequestException(`Selected plumber cannot accept new jobs: ${eligibility.reason}`);
      }
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: STATUS_MAP[dto.status],
        assignedPlumberProfileId: dto.assignedPlumberProfileId ?? before.assignedPlumberProfileId,
        notes: dto.note ? { create: { authorUserId: actor.userId, note: dto.note } } : undefined,
      },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "service_request.status_updated",
      targetType: "ServiceRequest",
      targetId: id,
      beforeJson: { status: before.status, assignedPlumberProfileId: before.assignedPlumberProfileId },
      afterJson: { status: updated.status, assignedPlumberProfileId: updated.assignedPlumberProfileId },
      reason: dto.note,
    });

    if (dto.status === "plumber_assigned") {
      await this.notifications.notify({
        userId: actor.userId,
        type: "job_accepted",
        title: "Plumber assigned",
        body: `A plumber has been assigned to your request.`,
        email: before.contactEmail,
      });
    }

    return updated;
  }

  async addNote(id: string, note: string, actor: { userId: string }) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Request not found");
    return this.prisma.serviceRequestNote.create({
      data: { serviceRequestId: id, authorUserId: actor.userId, note },
    });
  }
}
