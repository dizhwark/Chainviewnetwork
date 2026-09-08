import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { AppSettingsService } from "./app-settings.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { AuditService } from "../../common/audit/audit.service";

@ApiTags("app-settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller("app-settings")
export class AppSettingsController {
  constructor(
    private readonly service: AppSettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Post(":key")
  async set(@Param("key") key: string, @Body("value") value: unknown, @CurrentUser() user: AuthenticatedUser) {
    // Commission range 0-20% is enforced here per the product brief, not left to the client.
    if (key === "commissionPercent" && (typeof value !== "number" || value < 0 || value > 20)) {
      throw new Error("commissionPercent must be a number between 0 and 20");
    }
    await this.service.set(key, value, user.userId);
    await this.audit.record({
      actorUserId: user.userId,
      actorRole: user.role,
      action: "app_setting.updated",
      targetType: "AppSetting",
      targetId: key,
      afterJson: { value },
    });
    return { ok: true };
  }
}
