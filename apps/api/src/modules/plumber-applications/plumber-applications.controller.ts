import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UserRole } from "@prisma/client";
import { PlumberApplicationsService } from "./plumber-applications.service";
import { CreatePlumberApplicationDto, ApplicationDecisionDto } from "./dto/plumber-application.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags("plumber-applications")
@Controller("plumber-applications")
export class PlumberApplicationsController {
  constructor(private readonly service: PlumberApplicationsService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreatePlumberApplicationDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Get()
  adminList(@Query("status") status?: string, @Query("page") page = "1", @Query("pageSize") pageSize = "20") {
    return this.service.adminList({ status, page: Number(page), pageSize: Number(pageSize) });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Get(":id")
  adminGet(@Param("id") id: string) {
    return this.service.adminGet(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Post(":id/decision")
  decide(@Param("id") id: string, @Body() dto: ApplicationDecisionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.decide(id, dto, { userId: user.userId, role: user.role });
  }
}
