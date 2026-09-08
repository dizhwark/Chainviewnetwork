import { Injectable } from "@nestjs/common";
import { PLATFORM_DEFAULTS } from "@maybe/config";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Typed accessor over the AppSetting key/value store. Falls back to the
 * seeded defaults in @maybe/config if a key hasn't been written yet, so a
 * fresh environment behaves sensibly before an admin has touched settings.
 */
@Injectable()
export class AppSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommissionPercent(): Promise<number> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "commissionPercent" } });
    return (setting?.valueJson as number | undefined) ?? PLATFORM_DEFAULTS.commissionPercent;
  }

  async getHstPercent(): Promise<number> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "hstPercent" } });
    return (setting?.valueJson as number | undefined) ?? PLATFORM_DEFAULTS.hstPercent;
  }

  async getEmergencyFeeConfig() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "emergencyFee" } });
    return (setting?.valueJson as typeof PLATFORM_DEFAULTS.emergencyFee | undefined) ?? PLATFORM_DEFAULTS.emergencyFee;
  }

  async set(key: string, value: unknown, updatedByUserId: string): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, valueJson: value as any, updatedByUserId },
      update: { valueJson: value as any, updatedByUserId },
    });
  }

  async getAll() {
    return this.prisma.appSetting.findMany();
  }
}
