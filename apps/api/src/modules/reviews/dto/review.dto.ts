import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SubmitReviewDto {
  @ApiProperty() @IsInt() @Min(1) @Max(5) overallRating!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(5) punctualityRating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(5) communicationRating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(5) professionalismRating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(5) valueRating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comment?: string;
}

export class ReportReviewDto {
  @ApiProperty() @IsString() reason!: string;
}
