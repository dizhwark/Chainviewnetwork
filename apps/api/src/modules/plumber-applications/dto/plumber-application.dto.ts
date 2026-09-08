import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from "class-validator";

class ApplicationAddressDto {
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city!: string;
  @IsOptional() @IsString() province?: string;
  @IsString() postalCode!: string;
}

export class CreatePlumberApplicationDto {
  @ApiProperty() @IsString() @Length(2, 150) legalName!: string;
  @ApiProperty() @IsString() @Length(2, 150) businessName!: string;
  @ApiProperty({ enum: ["sole_proprietor", "partnership", "corporation"] })
  @IsIn(["sole_proprietor", "partnership", "corporation"])
  businessType!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @Length(8, 200) password!: string;
  @ApiProperty() @IsString() phone!: string;

  @ApiProperty({ type: ApplicationAddressDto })
  @ValidateNested()
  @Type(() => ApplicationAddressDto)
  businessAddress!: ApplicationAddressDto;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serviceAreaPostalPrefixes!: string[];

  @ApiProperty() @IsNumber() @Min(1) serviceRadiusKm!: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categorySlugs!: string[];

  @ApiProperty() @IsInt() @Min(0) yearsExperience!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() biography?: string;

  @ApiProperty() @IsString() licenseNumber!: string;
  @ApiProperty() @IsString() licenseType!: string;
  @ApiProperty() @IsString() licenseIssuingAuthority!: string;
  @ApiProperty() @IsISO8601() licenseExpiresOn!: string;
  @ApiProperty() @IsUUID() licenseDocumentMediaId!: string;

  @ApiProperty() @IsString() insuranceProvider!: string;
  @ApiProperty() @IsString() insurancePolicyNumber!: string;
  @ApiProperty() @IsInt() @Min(0) insuranceCoverageAmountCents!: number;
  @ApiProperty() @IsISO8601() insuranceExpiresOn!: string;
  @ApiProperty() @IsUUID() insuranceDocumentMediaId!: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() hstNumber?: string;

  @ApiProperty() @IsString() agreedToTermsVersion!: string;
}

export class ApplicationDecisionDto {
  @ApiProperty({ enum: ["approved", "rejected", "more_info_required"] })
  @IsIn(["approved", "rejected", "more_info_required"])
  decision!: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() reason?: string;
}
