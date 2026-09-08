import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const reviewSubmissionSchema = z.object({
  token: z.string().min(10),
  overallRating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional().or(z.literal("")),
});
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(200),
  kind: z.enum(["labour", "materials", "fee"]),
  quantity: z.number().min(0.01).max(9999),
  unitPriceCents: z.number().int().min(0),
  taxable: z.boolean().default(true),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const manualInvoiceSchema = z.object({
  serviceRequestId: z.string().uuid(),
  lineItems: z.array(invoiceLineItemSchema).min(1).max(50),
  discountCents: z.number().int().min(0).default(0),
  isEmergency: z.boolean().default(false),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type ManualInvoiceInput = z.infer<typeof manualInvoiceSchema>;

export const refundDecisionSchema = z.object({
  invoiceId: z.string().uuid(),
  type: z.enum(["partial", "full", "no_refund"]),
  amountCents: z.number().int().min(0).optional(),
  reason: z.string().min(3).max(2000),
});
export type RefundDecisionInput = z.infer<typeof refundDecisionSchema>;
