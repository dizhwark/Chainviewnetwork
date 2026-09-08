import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { InvoicesService } from "./invoices.service";
import { CreateManualInvoiceDto } from "./dto/invoice.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT];

@ApiTags("invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateManualInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createManual(dto, { userId: user.userId, role: user.role });
  }

  @Get()
  list(@Query("page") page = "1", @Query("pageSize") pageSize = "20") {
    return this.service.adminList({ page: Number(page), pageSize: Number(pageSize) });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.get(id);
  }
}
