import { BadRequestException, Body, Controller, Headers, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { refundDecisionSchema } from "@maybe/shared";
import { PaymentsService } from "./payments.service";
import { RefundsService } from "./refunds.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const MONEY_STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly refunds: RefundsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MONEY_STAFF, UserRole.SUPPORT_AGENT)
  @Post("invoices/:invoiceId/payment-link")
  createPaymentLink(@Param("invoiceId") invoiceId: string) {
    return this.payments.createPaymentLinkForInvoice(invoiceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MONEY_STAFF, UserRole.SUPPORT_AGENT)
  @Post("invoices/:invoiceId/record-mock-payment")
  recordMockPayment(@Param("invoiceId") invoiceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.recordMockPayment(invoiceId, { userId: user.userId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MONEY_STAFF)
  @Post("refunds")
  async issueRefund(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = refundDecisionSchema.parse(body);
    return this.refunds.issueRefund(dto, { userId: user.userId, role: user.role });
  }

  /**
   * Stripe webhook — signature-verified, idempotent. No auth guard: Stripe
   * itself is the caller, authenticated via the webhook signing secret
   * instead of a session token.
   */
  @HttpCode(200)
  @Post("webhook")
  async webhook(@Req() req: Request & { rawBody?: Buffer }, @Headers("stripe-signature") signature: string) {
    if (!req.rawBody) throw new BadRequestException("Missing raw request body");
    await this.payments.handleStripeWebhook(req.rawBody, signature);
    return { received: true };
  }
}
