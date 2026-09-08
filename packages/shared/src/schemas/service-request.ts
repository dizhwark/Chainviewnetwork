import { z } from "zod";

/** Canadian postal code, e.g. M5V 3A8 */
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i, "Enter a valid Canadian postal code");

export const addressSchema = z.object({
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(100),
  province: z.string().min(2).max(2).default("ON"),
  postalCode: postalCodeSchema,
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const urgencySchema = z.enum(["scheduled", "instant", "emergency"]);

/**
 * Phase-1 manual-mode service request form. Deliberately does not require an
 * account — a visitor can submit a request from the landing page, matching
 * the "Manual Validation Mode" requirement in the product brief.
 */
export const createServiceRequestSchema = z.object({
  contactName: z.string().min(2).max(150),
  contactEmail: z.string().email(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, "Enter a valid phone number"),
  address: addressSchema,
  categorySlug: z.string().min(1),
  problemDescription: z.string().min(10).max(2000),
  urgency: urgencySchema,
  scheduledFor: z.string().datetime().optional(),
  photoMediaIds: z.array(z.string().uuid()).max(10).default([]),
  marketingConsent: z.boolean().default(false),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;

export const updateServiceRequestStatusSchema = z.object({
  status: z.enum([
    "new",
    "contacted",
    "plumber_assigned",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "no_plumber_available",
  ]),
  note: z.string().max(2000).optional(),
  assignedPlumberProfileId: z.string().uuid().optional(),
});
export type UpdateServiceRequestStatusInput = z.infer<typeof updateServiceRequestStatusSchema>;
