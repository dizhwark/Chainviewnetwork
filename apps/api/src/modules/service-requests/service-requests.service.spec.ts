import { ServiceRequestsService } from "./service-requests.service";

function buildService(eligible: boolean) {
  const before = { id: "req-1", status: "NEW", assignedPlumberProfileId: null, contactEmail: "c@example.com" };
  const prisma = {
    serviceRequest: {
      findUnique: jest.fn().mockResolvedValue(before),
      update: jest.fn().mockResolvedValue({ ...before, status: "PLUMBER_ASSIGNED" }),
    },
  } as any;
  const geocoding = {} as any;
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) } as any;
  const emailService = { send: jest.fn().mockResolvedValue(undefined) } as any;
  const analytics = { track: jest.fn().mockResolvedValue(undefined) } as any;
  const audit = { record: jest.fn().mockResolvedValue(undefined) } as any;
  const plumbers = {
    isEligibleForNewJobs: jest
      .fn()
      .mockResolvedValue(eligible ? { eligible: true } : { eligible: false, reason: "Insurance document has expired" }),
  } as any;

  return new ServiceRequestsService(prisma, geocoding, notifications, emailService, analytics, audit, plumbers);
}

describe("ServiceRequestsService.updateStatus", () => {
  it("assigns an eligible plumber", async () => {
    const service = buildService(true);
    const result = await service.updateStatus(
      "req-1",
      { status: "plumber_assigned", assignedPlumberProfileId: "plumber-1" } as any,
      { userId: "admin-1", role: "ADMIN" },
    );
    expect(result.status).toBe("PLUMBER_ASSIGNED");
  });

  it("refuses to assign a plumber with expired documentation", async () => {
    const service = buildService(false);
    await expect(
      service.updateStatus(
        "req-1",
        { status: "plumber_assigned", assignedPlumberProfileId: "plumber-1" } as any,
        { userId: "admin-1", role: "ADMIN" },
      ),
    ).rejects.toThrow(/Insurance document has expired/);
  });

  it("requires an assignedPlumberProfileId for the plumber_assigned status", async () => {
    const service = buildService(true);
    await expect(
      service.updateStatus("req-1", { status: "plumber_assigned" } as any, { userId: "admin-1", role: "ADMIN" }),
    ).rejects.toThrow(/assignedPlumberProfileId is required/);
  });
});
