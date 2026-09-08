import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateUploadUrlDto } from "./dto/create-upload-url.dto";
import { S3Service } from "./s3.service";

@ApiTags("files")
@Controller("files")
export class FilesController {
  constructor(
    private readonly s3: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Issues a signed upload URL + creates a pending Media row. Public
   * (rate-limited) because Phase-1 customer requests and plumber
   * applications don't require an account first. File-type/size validation
   * happens both here (allow-list + size cap in the DTO) and should be
   * re-checked by a malware-scanning integration before the document is
   * ever shown to an admin in production (see docs/architecture.md §8 —
   * "malware-scanning integration point" is a hook, not implemented here).
   */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("upload-url")
  async createUploadUrl(@Body() dto: CreateUploadUrlDto) {
    const { storageKey, uploadUrl } = await this.s3.createSignedUploadUrl(dto.purpose, dto.mimeType);
    const media = await this.prisma.media.create({
      data: {
        purpose: dto.purpose as any,
        storageKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        isPrivate: dto.purpose !== "SERVICE_REQUEST_PHOTO",
      },
    });
    return { mediaId: media.id, uploadUrl, storageKey };
  }
}
