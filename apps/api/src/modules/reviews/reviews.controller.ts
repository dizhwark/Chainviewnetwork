import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { ReviewsService } from "./reviews.service";
import { SubmitReviewDto, ReportReviewDto } from "./dto/review.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT];

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post("submit/:token")
  submit(@Param("token") token: string, @Body() dto: SubmitReviewDto) {
    return this.service.submitByToken(token, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/report")
  report(@Param("id") id: string, @Body() dto: ReportReviewDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.report(id, dto.reason, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Get("reports")
  adminListReports(@Query("status") status?: string) {
    return this.service.adminListReports(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @Post("reports/:id/resolve")
  adminResolve(@Param("id") id: string, @Body("status") status: "resolved" | "dismissed") {
    return this.service.adminResolveReport(id, status);
  }
}
