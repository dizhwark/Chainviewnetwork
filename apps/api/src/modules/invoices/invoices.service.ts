import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LineItemKind } from "@prisma/client";
import { calculateInvoiceTotals } from "@maybe/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppSettingsService } from "../app-settings/app-settings.service";
import { AuditService } from "../../common/audit/audit.service";
import { CreateManualInvoiceDto } from "./dto/invoice.dto";

const KIND_MAP: Record<string, LineItemKind> = {
  labour: LineItemKind.LABOUR,
  materials: LineItemKind.MATERIALS,
  fee: LineItemKind.FEE,
};

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appSettings: AppSettingsService,
    private readonly audit: AuditService,
  ) {}

  async createManual(dto: CreateManualInvoiceDto, actor: { userId: string; role: string }) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: dto.serviceRequestId } });
    if (!request) throw new NotFoundException("Service request not found");
    if (!request.assignedPlumberProfileId) {
      throw new BadRequestException("Assign a plumber to this request before invoicing");
    }

    const subtotalCents = dto.lineItems.reduce((sum, li) => sum + Math.round(li.quantity * li.unitPriceCents), 0);

    const [commissionPercent, hstPercent, emergencyFeeConfig] = await Promise.all([
      this.appSettings.getCommissionPercent(),
      this.appSettings.getHstPercent(),
      this.appSettings.getEmergencyFeeConfig(),
    ]);

    const totals = calculateInvoiceTotals({
      subtotalCents,
      discountCents: dto.discountCents ?? 0,
      hstPercent,
      commissionPercent,
      emergency: { isEmergency: dto.isEmergency ?? false, config: emergencyFeeConfig },
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        serviceRequestId: request.id,
        plumberProfileId: request.assignedPlumberProfileId,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        emergencyFeeCents: totals.emergencyFeeCents,
        hstCents: totals.hstCents,
        totalCents: totals.totalCents,
        commissionCents: totals.commissionCents,
        plumberPayoutCents: totals.plumberGrossPayoutCents,
        notes: dto.notes,
        lineItems: {
          create: dto.lineItems.map((li) => ({
            description: li.description,
            kind: KIND_MAP[li.kind],
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            taxable: li.taxable ?? true,
            totalCents: Math.round(li.quantity * li.unitPriceCents),
            notes: li.notes,
          })),
        },
      },
      include: { lineItems: true },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "invoice.created",
      targetType: "Invoice",
      targetId: invoice.id,
      afterJson: { totalCents: invoice.totalCents, serviceRequestId: request.id },
    });

    return invoice;
  }

  async get(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true, transactions: true, serviceRequest: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async adminList(params: { page: number; pageSize: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        include: { lineItems: true, serviceRequest: true },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.invoice.count(),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
