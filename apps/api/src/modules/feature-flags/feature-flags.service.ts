import { Injectable } from "@nestjs/common";
import { FEATURE_FLAG_DEFAULTS, FeatureFlagKey } from "@maybe/config";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(key: FeatureFlagKey): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    return flag?.enabled ?? FEATURE_FLAG_DEFAULTS[key];
  }

  async list() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async set(key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled },
      update: { enabled },
    });
  }
}
