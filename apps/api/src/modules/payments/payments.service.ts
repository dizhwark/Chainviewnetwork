import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { PaymentTransactionStatus, PaymentTransactionType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BRAND } from "@maybe/config";

/**
 * Marketplace payments via Stripe Checkout (test mode) with a documented
 * mock fallback when no Stripe key is configured — see docs/architecture.md
 * §8. The mock never pretends a card was actually charged: it returns a
 * fake-but-clearly-labelled link and requires the admin to record payment
 * manually, whereas the real Stripe path is driven end-to-end by webhooks.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger("PaymentsService");
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
      : null;
  }

  isLive(): boolean {
    return this.stripe !== null;
  }

  async createPaymentLinkForInvoice(invoiceId: string): Promise<{ url: string; mode: "stripe" | "mock" }> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { lineItems: true } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "PAID") throw new BadRequestException("Invoice is already paid");

    if (!this.stripe) {
      this.logger.warn(
        `[DEV FALLBACK] PAYMENTS_PROVIDER=mock (no STRIPE_SECRET_KEY) — generating a mock payment link for invoice ${invoiceId}. ` +
          `No real charge will occur; use the admin portal to record payment manually in dev.`,
      );
      return { url: `${process.env.WEB_BASE_URL}/dev/mock-payment/${invoiceId}`, mode: "mock" };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: `${BRAND.name} — service invoice ${invoice.id.slice(0, 8)}` },
            unit_amount: invoice.totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: invoice.id },
      success_url: `${process.env.WEB_BASE_URL}/status?paid=1`,
      cancel_url: `${process.env.WEB_BASE_URL}/status?cancelled=1`,
    });

    await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: "SENT", issuedAt: new Date() } });

    return { url: session.url!, mode: "stripe" };
  }

  /** Idempotent: relies on a unique idempotencyKey per Stripe event so retried webhooks never double-charge/double-record. */
  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.stripe) throw new BadRequestException("Stripe is not configured");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new BadRequestException("STRIPE_WEBHOOK_SECRET is not configured");

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (!invoiceId) return;

      const idempotencyKey = `stripe_event_${event.id}`;
      const existing = await this.prisma.paymentTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) {
        this.logger.log(`Duplicate webhook delivery for ${event.id} — already processed, skipping.`);
        return;
      }

      const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) return;

      await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.paymentTransaction.create({
          data: {
            invoiceId,
            provider: "stripe",
            providerTransactionId: session.payment_intent as string,
            type: PaymentTransactionType.CAPTURE,
            amountCents: invoice.totalCents,
            status: PaymentTransactionStatus.SUCCEEDED,
            idempotencyKey,
            events: { create: { eventType: event.type, payload: event as any } },
          },
        });
        await tx.platformFee.create({
          data: {
            paymentTransactionId: transaction.id,
            commissionCents: invoice.commissionCents,
            emergencyFeeCents: invoice.emergencyFeeCents,
            hstCents: invoice.hstCents,
            netToPlumberCents: invoice.plumberPayoutCents,
          },
        });
        await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });
        await tx.payout.create({
          data: {
            plumberProfileId: invoice.plumberProfileId!,
            amountCents: invoice.plumberPayoutCents,
            status: "PENDING",
            periodStart: new Date(),
            periodEnd: new Date(),
          },
        });
      });
    }
  }

  /** Records a manual payment for the mock/dev flow (no Stripe configured). */
  async recordMockPayment(invoiceId: string, actor: { userId: string }): Promise<void> {
    if (this.stripe) throw new BadRequestException("Live Stripe is configured — use the real checkout flow, not the mock recorder");
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "PAID") return;

    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          invoiceId,
          provider: "mock",
          type: PaymentTransactionType.CAPTURE,
          amountCents: invoice.totalCents,
          status: PaymentTransactionStatus.SUCCEEDED,
          idempotencyKey: `mock_${invoiceId}_${randomUUID()}`,
          events: { create: { eventType: "mock.payment_recorded", payload: { recordedBy: actor.userId } } },
        },
      });
      await tx.platformFee.create({
        data: {
          paymentTransactionId: transaction.id,
          commissionCents: invoice.commissionCents,
          emergencyFeeCents: invoice.emergencyFeeCents,
          hstCents: invoice.hstCents,
          netToPlumberCents: invoice.plumberPayoutCents,
        },
      });
      await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });
      await tx.payout.create({
        data: {
          plumberProfileId: invoice.plumberProfileId!,
          amountCents: invoice.plumberPayoutCents,
          status: "PENDING",
          periodStart: new Date(),
          periodEnd: new Date(),
        },
      });
    });
  }
}
