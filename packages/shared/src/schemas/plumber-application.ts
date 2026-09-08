import { z } from "zod";
import { addressSchema, postalCodeSchema } from "./service-request";

export const businessTypeSchema = z.enum(["sole_proprietor", "partnership", "corporation"]);

export const createPlumberApplicationSchema = z.object({
  legalName: z.string().min(2).max(150),
  businessName: z.string().min(2).max(150),
  businessType: businessTypeSchema,
  email: z.string().email(),
  password: z.string().min(8).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, "Enter a valid phone number"),
  businessAddress: addressSchema,
  serviceAreaPostalPrefixes: z.array(postalCodeSchema.transform((v) => v.slice(0, 3))).min(1).max(20),
  serviceRadiusKm: z.number().min(1).max(100),
  categorySlugs: z.array(z.string()).min(1),
  yearsExperience: z.number().int().min(0).max(60),
  biography: z.string().max(2000).optional().or(z.literal("")),

  licenseNumber: z.string().min(1).max(100),
  licenseType: z.string().min(1).max(100),
  licenseIssuingAuthority: z.string().min(1).max(150),
  licenseExpiresOn: z.string().date(),
  licenseDocumentMediaId: z.string().uuid(),

  insuranceProvider: z.string().min(1).max(150),
  insurancePolicyNumber: z.string().min(1).max(100),
  insuranceCoverageAmountCents: z.number().int().min(0),
  insuranceExpiresOn: z.string().date(),
  insuranceDocumentMediaId: z.string().uuid(),

  hstNumber: z.string().max(50).optional().or(z.literal("")),

  agreedToTermsVersion: z.string().min(1),
  consentToVerification: z.literal(true),
});

export type CreatePlumberApplicationInput = z.infer<typeof createPlumberApplicationSchema>;

export const applicationDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "more_info_required"]),
  reason: z.string().max(2000).optional(),
});
export type ApplicationDecisionInput = z.infer<typeof applicationDecisionSchema>;
