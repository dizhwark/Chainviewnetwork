import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import Stripe from "stripe";
import { RefundStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../../common/audit/audit.service";
import { RefundDecisionInput } from "@maybe/shared";

/**
 * Refunds are ALWAYS administrator-initiated — there is no customer-facing
 * refund button anywhere in this codebase (see docs/permissions-matrix.md).
 * Every call here writes an audit log entry with before/after invoice state.
 */
@Injectable()
export class RefundsService {
  private readonly logger = new Logger("RefundsService");
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
      : null;
  }

  async issueRefund(input: RefundDecisionInput, actor: { userId: string; role: string }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { transactions: { where: { type: "CAPTURE", status: "SUCCEEDED" } } },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "PAID" && invoice.status !== "PARTIALLY_REFUNDED") {
      throw new BadRequestException("Only a paid invoice can be refunded");
    }

    const captureTransaction = invoice.transactions[0];
    if (!captureTransaction) throw new BadRequestException("No successful payment found for this invoice");

    if (input.type === "no_refund") {
      await this.audit.record({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "refund.no_refund_decision",
        targetType: "Invoice",
        targetId: invoice.id,
        reason: input.reason,
      });
      return { status: "no_refund" };
    }

    const amountCents = input.type === "full" ? invoice.totalCents : input.amountCents;
    if (!amountCents || amountCents <= 0 || amountCents > invoice.totalCents) {
      throw new BadRequestException("Invalid refund amount");
    }

    let providerRefundId: string | undefined;
    if (this.stripe && captureTransaction.providerTransactionId) {
      const refund = await this.stripe.refunds.create({
        payment_intent: captureTransaction.providerTransactionId,
        amount: amountCents,
      });
      providerRefundId = refund.id;
    } else {
      this.logger.warn(`[DEV FALLBACK] No live Stripe payment intent — recording refund without a real Stripe call.`);
    }

    const newStatus = input.type === "full" ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await this.prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          paymentTransactionId: captureTransaction.id,
          amountCents,
          reason: input.reason,
          decidedByUserId: actor.userId,
          status: RefundStatus.SUCCEEDED,
          providerRefundId,
        },
      });
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: newStatus } });
    });

    await this.audit.record({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "refund.issued",
      targetType: "Invoice",
      targetId: invoice.id,
      beforeJson: { status: invoice.status },
      afterJson: { status: newStatus, amountCents },
      reason: input.reason,
    });

    return { status: newStatus, amountCents };
  }
}
