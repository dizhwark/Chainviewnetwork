import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { SubmitReviewDto } from "./dto/review.dto";

const REVIEW_EDIT_WINDOW_DAYS = 14;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async submitByToken(token: string, dto: SubmitReviewDto) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { reviewToken: token },
      include: { review: true },
    });
    if (!request) throw new NotFoundException("Review link not found");
    if (request.status !== "COMPLETED") {
      throw new BadRequestException("Reviews can only be left for completed jobs");
    }
    if (!request.assignedPlumberProfileId) {
      throw new BadRequestException("No plumber is associated with this request");
    }
    if (request.review) {
      throw new BadRequestException("A review has already been submitted for this job");
    }

    const editableUntil = new Date();
    editableUntil.setDate(editableUntil.getDate() + REVIEW_EDIT_WINDOW_DAYS);

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          serviceRequestId: request.id,
          plumberProfileId: request.assignedPlumberProfileId!,
          overallRating: dto.overallRating,
          punctualityRating: dto.punctualityRating,
          communicationRating: dto.communicationRating,
          professionalismRating: dto.professionalismRating,
          valueRating: dto.valueRating,
          comment: dto.comment,
          isVerifiedBooking: true,
          editableUntil,
          isDemoData: request.isDemoData,
        },
      });

      const agg = await tx.review.aggregate({
        where: { plumberProfileId: request.assignedPlumberProfileId! },
        _avg: { overallRating: true },
        _count: true,
      });
      await tx.plumberProfile.update({
        where: { id: request.assignedPlumberProfileId! },
        data: { averageRating: agg._avg.overallRating ?? 0, reviewCount: agg._count },
      });

      return created;
    });

    await this.analytics.track("review_submitted", { serviceRequestId: request.id });
    return review;
  }

  async report(reviewId: string, reason: string, reportedByUserId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException("Review not found");
    return this.prisma.reviewReport.create({ data: { reviewId, reason, reportedByUserId } });
  }

  async adminListReports(status?: string) {
    return this.prisma.reviewReport.findMany({
      where: status ? { status } : undefined,
      include: { review: { include: { plumberProfile: { include: { user: true } } } }, reportedBy: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminResolveReport(reportId: string, status: "resolved" | "dismissed") {
    const report = await this.prisma.reviewReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Report not found");
    return this.prisma.reviewReport.update({ where: { id: reportId }, data: { status } });
  }
}
