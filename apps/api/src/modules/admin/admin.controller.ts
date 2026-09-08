import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT];
const MONEY_STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Roles(...STAFF)
  @Get("dashboard")
  dashboard() {
    return this.service.dashboard();
  }

  @Roles(...STAFF)
  @Get("audit-log")
  auditLog(@Query("page") page = "1", @Query("pageSize") pageSize = "50") {
    return this.service.auditLog({ page: Number(page), pageSize: Number(pageSize) });
  }

  @Roles(...STAFF)
  @Get("users")
  listUsers(@Query("role") role?: string, @Query("page") page = "1", @Query("pageSize") pageSize = "20") {
    return this.service.listUsers({ role, page: Number(page), pageSize: Number(pageSize) });
  }

  @Roles(...MONEY_STAFF)
  @Post("users/:id/suspend")
  suspend(@Param("id") id: string, @Body("reason") reason: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.setUserStatus(id, "SUSPENDED", reason, { userId: user.userId, role: user.role });
  }

  @Roles(...MONEY_STAFF)
  @Post("users/:id/reactivate")
  reactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.setUserStatus(id, "ACTIVE", undefined, { userId: user.userId, role: user.role });
  }
}
