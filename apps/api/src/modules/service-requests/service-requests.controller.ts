import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UserRole } from "@prisma/client";
import { ServiceRequestsService } from "./service-requests.service";
import { CreateServiceRequestDto, UpdateServiceRequestStatusDto, AddServiceRequestNoteDto } from "./dto/service-request.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT];

@ApiTags("service-requests")
@Controller("service-requests")
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateServiceRequestDto) {
    return this.service.create(dto);
  }

  @Get("status/:token")
  getStatus(@Param("token") token: string) {
    return this.service.getByStatusToken(token);
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
  @Post(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateStatus(id, dto, { userId: user.userId, role: user.role });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Post(":id/notes")
  addNote(@Param("id") id: string, @Body() dto: AddServiceRequestNoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addNote(id, dto.note, { userId: user.userId });
  }
}
