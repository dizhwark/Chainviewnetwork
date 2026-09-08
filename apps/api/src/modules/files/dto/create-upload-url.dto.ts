import { IsIn, IsInt, IsString, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"];
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const UPLOAD_PURPOSES = [
  "SERVICE_REQUEST_PHOTO",
  "LICENSE_DOCUMENT",
  "INSURANCE_DOCUMENT",
  "JOB_PHOTO",
  "PROFILE_PHOTO",
  "BUSINESS_LOGO",
] as const;

export class CreateUploadUrlDto {
  @ApiProperty({ enum: UPLOAD_PURPOSES })
  @IsIn(UPLOAD_PURPOSES)
  purpose!: (typeof UPLOAD_PURPOSES)[number];

  @ApiProperty({ enum: ALLOWED_UPLOAD_MIME_TYPES })
  @IsIn(ALLOWED_UPLOAD_MIME_TYPES)
  mimeType!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_SIZE_BYTES)
  sizeBytes!: number;

  @ApiProperty()
  @IsString()
  fileName!: string;
}
