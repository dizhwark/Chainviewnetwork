import { InvoicesService } from "./invoices.service";

describe("InvoicesService.createManual", () => {
  function buildService() {
    const createdInvoice = { id: "inv-1" };
    const prisma = {
      serviceRequest: {
        findUnique: jest.fn().mockResolvedValue({ id: "req-1", assignedPlumberProfileId: "plumber-1" }),
      },
      invoice: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...createdInvoice, ...data })),
      },
    } as any;

    const appSettings = {
      getCommissionPercent: jest.fn().mockResolvedValue(15),
      getHstPercent: jest.fn().mockResolvedValue(13),
      getEmergencyFeeConfig: jest
        .fn()
        .mockResolvedValue({ enabled: true, type: "fixed_cents", amountCents: 5_000, percent: 10 }),
    } as any;

    const audit = { record: jest.fn().mockResolvedValue(undefined) } as any;

    return new InvoicesService(prisma, appSettings, audit);
  }

  it("computes commission, HST, and total correctly for a non-emergency job", async () => {
    const service = buildService();
    const result = await service.createManual(
      {
        serviceRequestId: "req-1",
        lineItems: [{ description: "Drain cleaning", kind: "labour", quantity: 1, unitPriceCents: 15_000 }],
      } as any,
      { userId: "admin-1", role: "ADMIN" },
    );

    expect(result.subtotalCents).toBe(15_000);
    expect(result.commissionCents).toBe(2_250); // 15% of 15,000
    expect(result.hstCents).toBe(1_950); // 13% of 15,000
    expect(result.totalCents).toBe(16_950);
    expect(result.plumberPayoutCents).toBe(12_750);
  });

  it("rejects invoicing a request with no assigned plumber", async () => {
    const service = buildService();
    (service as any).prisma.serviceRequest.findUnique.mockResolvedValue({ id: "req-2", assignedPlumberProfileId: null });

    await expect(
      service.createManual(
        { serviceRequestId: "req-2", lineItems: [{ description: "x", kind: "labour", quantity: 1, unitPriceCents: 100 }] } as any,
        { userId: "admin-1", role: "ADMIN" },
      ),
    ).rejects.toThrow(/Assign a plumber/);
  });
});
