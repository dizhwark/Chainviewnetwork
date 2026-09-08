/* eslint-disable no-console */
import "reflect-metadata";
import { PrismaClient, UserRole, PlumberApprovalStatus, ServiceRequestStatus, Urgency, DisputeStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { PLATFORM_DEFAULTS, FEATURE_FLAG_DEFAULTS, FEATURE_FLAG_DESCRIPTIONS } from "@maybe/config";
import { SERVICE_CATEGORY_SEEDS } from "@maybe/shared";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the demo seed script with NODE_ENV=production. Seed data includes a fixed demo password and is for local/dev use only.");
  }

  console.log("Seeding MAYBE demo data (development only)...");

  // --- Feature flags -------------------------------------------------------
  for (const key of Object.keys(FEATURE_FLAG_DEFAULTS) as (keyof typeof FEATURE_FLAG_DEFAULTS)[]) {
    await prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled: FEATURE_FLAG_DEFAULTS[key], description: FEATURE_FLAG_DESCRIPTIONS[key] },
      update: {},
    });
  }

  // --- App settings ----------------------------------------------------------
  await prisma.appSetting.upsert({
    where: { key: "commissionPercent" },
    create: { key: "commissionPercent", valueJson: PLATFORM_DEFAULTS.commissionPercent },
    update: {},
  });
  await prisma.appSetting.upsert({
    where: { key: "hstPercent" },
    create: { key: "hstPercent", valueJson: PLATFORM_DEFAULTS.hstPercent },
    update: {},
  });
  await prisma.appSetting.upsert({
    where: { key: "emergencyFee" },
    create: { key: "emergencyFee", valueJson: PLATFORM_DEFAULTS.emergencyFee as any },
    update: {},
  });

  // --- Service categories -----------------------------------------------
  const categories = new Map<string, string>();
  for (const seed of SERVICE_CATEGORY_SEEDS) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        emergencyEligible: seed.emergencyEligible,
        pricingMethod: seed.pricingMethod.toUpperCase() as any,
        baseDiagnosticFeeCents: seed.baseDiagnosticFeeCents,
        estimatedRangeMinCents: seed.estimatedRangeCents[0],
        estimatedRangeMaxCents: seed.estimatedRangeCents[1],
      },
      update: {},
    });
    categories.set(seed.slug, category.id);
  }

  // --- Service zone (Downtown Toronto, admin-configurable) ------------------
  const zone = await prisma.serviceZone.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: PLATFORM_DEFAULTS.launchServiceZone.name,
      province: PLATFORM_DEFAULTS.launchServiceZone.province,
      postalPrefixes: [...PLATFORM_DEFAULTS.launchServiceZone.postalPrefixes],
      centerLat: PLATFORM_DEFAULTS.launchServiceZone.centerLat,
      centerLng: PLATFORM_DEFAULTS.launchServiceZone.centerLng,
      radiusKm: PLATFORM_DEFAULTS.launchServiceZone.radiusKm,
    },
    update: {},
  });

  // --- Staff accounts --------------------------------------------------------
  const demoPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await argon2.hash(demoPassword);

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@maybe.example" },
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@maybe.example",
      fullName: "Ava Administrator (demo)",
      phone: "+14165550100",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "support@maybe.example" },
    create: {
      email: "support@maybe.example",
      fullName: "Sam Support (demo)",
      phone: "+14165550101",
      passwordHash,
      role: UserRole.SUPPORT_AGENT,
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  // --- Customers ---------------------------------------------------------
  const customerSeeds = [
    { email: "priya.customer@maybe.example", name: "Priya Nair (demo)" },
    { email: "marcus.customer@maybe.example", name: "Marcus Bell (demo)" },
    { email: "chen.customer@maybe.example", name: "Chen Wu (demo)" },
  ];
  const customers = [];
  for (const seed of customerSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      create: {
        email: seed.email,
        fullName: seed.name,
        phone: "+14165550111",
        passwordHash,
        role: UserRole.CUSTOMER,
        emailVerifiedAt: new Date(),
        customerProfile: { create: {} },
      },
      update: {},
      include: { customerProfile: true },
    });
    customers.push(user);
  }

  // --- Plumbers: one applicant, two approved, one suspended -----------------
  async function makePlumber(opts: {
    email: string;
    legalName: string;
    businessName: string;
    approvalStatus: PlumberApprovalStatus;
    isSuspended?: boolean;
    categorySlugs: string[];
  }) {
    const business = await prisma.plumbingBusiness.create({
      data: {
        legalName: opts.legalName,
        businessName: opts.businessName,
        businessType: "SOLE_PROPRIETOR",
        addressLine1: "100 Queen St W",
        city: "Toronto",
        province: "ON",
        postalCode: "M5H 2N2",
      },
    });
    const user = await prisma.user.upsert({
      where: { email: opts.email },
      create: {
        email: opts.email,
        fullName: opts.legalName,
        phone: "+14165550199",
        passwordHash,
        role: UserRole.PLUMBER,
        emailVerifiedAt: new Date(),
      },
      update: {},
    });
    const profile = await prisma.plumberProfile.create({
      data: {
        userId: user.id,
        businessId: business.id,
        biography: "Demonstration plumber profile for local development — not a real business.",
        yearsExperience: 8,
        approvalStatus: opts.approvalStatus,
        isSuspended: opts.isSuspended ?? false,
        suspensionReason: opts.isSuspended ? "Demo: repeated late cancellations" : undefined,
        averageRating: opts.approvalStatus === "APPROVED" ? 4.7 : 0,
        reviewCount: 0,
        licenses: {
          create: {
            licenseNumber: "ON-DEMO-12345",
            licenseType: "Journeyman Plumber",
            issuingAuthority: "Ontario College of Trades (demo)",
            expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300),
            documentMediaId: "00000000-0000-0000-0000-000000000000",
            status: opts.approvalStatus,
          },
        },
        insuranceDocuments: {
          create: {
            provider: "Demo Insurance Co.",
            policyNumber: "POL-DEMO-9999",
            coverageAmountCents: 200_000_00,
            expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300),
            documentMediaId: "00000000-0000-0000-0000-000000000000",
            status: opts.approvalStatus,
          },
        },
        services: { create: opts.categorySlugs.map((slug) => ({ categoryId: categories.get(slug)! })) },
        serviceAreas: { create: [{ serviceZoneId: zone.id, radiusKmOverride: 15 }] },
      },
    });
    return profile;
  }

  const approvedPlumber1 = await makePlumber({
    email: "jordan.plumber@maybe.example",
    legalName: "Jordan Reyes",
    businessName: "Reyes Plumbing Co. (demo)",
    approvalStatus: PlumberApprovalStatus.APPROVED,
    categorySlugs: ["clogged-drain", "faucet-repair", "toilet-repair-install", "drain-cleaning"],
  });
  const approvedPlumber2 = await makePlumber({
    email: "kim.plumber@maybe.example",
    legalName: "Kim Okafor",
    businessName: "Okafor & Sons Plumbing (demo)",
    approvalStatus: PlumberApprovalStatus.APPROVED,
    categorySlugs: ["emergency-leak", "burst-pipe", "water-heater-issue", "sump-pump-issue"],
  });
  await makePlumber({
    email: "sam.applicant@maybe.example",
    legalName: "Sam Delacroix",
    businessName: "Delacroix Plumbing (demo)",
    approvalStatus: PlumberApprovalStatus.SUBMITTED,
    categorySlugs: ["sink-repair"],
  });
  await makePlumber({
    email: "taylor.suspended@maybe.example",
    legalName: "Taylor Brooks",
    businessName: "Brooks Plumbing (demo)",
    approvalStatus: PlumberApprovalStatus.APPROVED,
    isSuspended: true,
    categorySlugs: ["pipe-repair"],
  });

  // --- Service requests in various Phase-1 states ---------------------------
  const cloggedDrainId = categories.get("clogged-drain")!;
  const emergencyLeakId = categories.get("emergency-leak")!;

  await prisma.serviceRequest.create({
    data: {
      contactName: "Priya Nair",
      contactEmail: "priya.customer@maybe.example",
      contactPhone: "+14165550111",
      addressLine1: "25 Dundas St W",
      city: "Toronto",
      province: "ON",
      postalCode: "M5G 1C3",
      lat: 43.6555,
      lng: -79.3834,
      categoryId: cloggedDrainId,
      problemDescription: "Kitchen sink draining very slowly for the past two days. (Demo request)",
      urgency: Urgency.SCHEDULED,
      status: ServiceRequestStatus.NEW,
      isDemoData: true,
    },
  });

  const assignedRequest = await prisma.serviceRequest.create({
    data: {
      contactName: "Marcus Bell",
      contactEmail: "marcus.customer@maybe.example",
      contactPhone: "+14165550112",
      addressLine1: "88 Queens Quay W",
      city: "Toronto",
      province: "ON",
      postalCode: "M5J 0B8",
      lat: 43.6398,
      lng: -79.3808,
      categoryId: emergencyLeakId,
      problemDescription: "Water leaking from under the bathroom sink. (Demo request)",
      urgency: Urgency.EMERGENCY,
      status: ServiceRequestStatus.COMPLETED,
      assignedPlumberProfileId: approvedPlumber2.id,
      isDemoData: true,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      serviceRequestId: assignedRequest.id,
      plumberProfileId: approvedPlumber2.id,
      subtotalCents: 22_000,
      discountCents: 0,
      emergencyFeeCents: 5_000,
      hstCents: 3_510,
      totalCents: 30_510,
      commissionCents: 3_300,
      plumberPayoutCents: 18_700,
      status: "PAID",
      issuedAt: new Date(),
      lineItems: {
        create: [
          { description: "Emergency call-out + diagnosis", kind: "LABOUR", quantity: 1, unitPriceCents: 12_000, taxable: true, totalCents: 12_000 },
          { description: "Replacement P-trap + fittings", kind: "MATERIALS", quantity: 1, unitPriceCents: 10_000, taxable: true, totalCents: 10_000 },
        ],
      },
    },
  });

  // A real payment (mock provider) so admin refund flows have something to act on.
  const invoiceTransaction = await prisma.paymentTransaction.create({
    data: {
      invoiceId: invoice.id,
      provider: "mock",
      type: "CAPTURE",
      amountCents: invoice.totalCents,
      status: "SUCCEEDED",
      idempotencyKey: `seed_${invoice.id}`,
      events: { create: { eventType: "mock.payment_recorded", payload: { seed: true } } },
    },
  });
  await prisma.platformFee.create({
    data: {
      paymentTransactionId: invoiceTransaction.id,
      commissionCents: invoice.commissionCents,
      emergencyFeeCents: invoice.emergencyFeeCents,
      hstCents: invoice.hstCents,
      netToPlumberCents: invoice.plumberPayoutCents,
    },
  });
  await prisma.payout.create({
    data: {
      plumberProfileId: approvedPlumber2.id,
      amountCents: invoice.plumberPayoutCents,
      status: "PENDING",
      periodStart: new Date(),
      periodEnd: new Date(),
    },
  });

  await prisma.review.create({
    data: {
      serviceRequestId: assignedRequest.id,
      plumberProfileId: approvedPlumber2.id,
      overallRating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      professionalismRating: 4,
      valueRating: 4,
      comment: "Fast response for an emergency leak, explained everything clearly. (Demo review)",
      isVerifiedBooking: true,
      editableUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      isDemoData: true,
    },
  });
  await prisma.plumberProfile.update({ where: { id: approvedPlumber2.id }, data: { averageRating: 5, reviewCount: 1 } });

  const disputedRequest = await prisma.serviceRequest.create({
    data: {
      contactName: "Chen Wu",
      contactEmail: "chen.customer@maybe.example",
      contactPhone: "+14165550113",
      addressLine1: "10 Yonge St",
      city: "Toronto",
      province: "ON",
      postalCode: "M5E 1R4",
      lat: 43.6435,
      lng: -79.3766,
      categoryId: cloggedDrainId,
      problemDescription: "Drain cleared but charge seems higher than the quoted estimate. (Demo request)",
      urgency: Urgency.SCHEDULED,
      status: ServiceRequestStatus.COMPLETED,
      assignedPlumberProfileId: approvedPlumber1.id,
      isDemoData: true,
    },
  });

  await prisma.dispute.create({
    data: {
      customerProfileId: customers[2].customerProfile!.id,
      plumberProfileId: approvedPlumber1.id,
      reason: "billing_discrepancy",
      description: "Final invoice was $40 higher than the estimate I approved, with no change order shown. (Demo dispute)",
      status: DisputeStatus.OPEN,
    },
  });

  console.log("\nSeed complete. Demo accounts (development only — password: " + demoPassword + "):");
  console.log(`  Super admin:    ${admin.email}`);
  console.log("  Support agent:  support@maybe.example");
  console.log("  Customers:      priya.customer@maybe.example, marcus.customer@maybe.example, chen.customer@maybe.example");
  console.log("  Approved:       jordan.plumber@maybe.example, kim.plumber@maybe.example");
  console.log("  Applicant:      sam.applicant@maybe.example");
  console.log("  Suspended:      taylor.suspended@maybe.example");
  console.log(`\nDemo invoice ${invoice.id} — subtotal $220.00, emergency fee $50.00, HST $35.10, total $305.10.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
