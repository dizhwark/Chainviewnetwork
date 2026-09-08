import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from "class-validator";

class AddressDto {
  @IsString() @Length(3, 200) line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city!: string;
  @IsOptional() @IsString() province?: string;
  @IsString() postalCode!: string;
}

export class CreateServiceRequestDto {
  @ApiProperty() @IsString() @Length(2, 150) contactName!: string;
  @ApiProperty() @IsEmail() contactEmail!: string;
  @ApiProperty() @IsString() contactPhone!: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiProperty() @IsString() categorySlug!: string;
  @ApiProperty() @IsString() @Length(10, 2000) problemDescription!: string;
  @ApiProperty({ enum: ["scheduled", "instant", "emergency"] }) @IsEnum(["scheduled", "instant", "emergency"]) urgency!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsISO8601() scheduledFor?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID("4", { each: true })
  photoMediaIds?: string[];

  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() marketingConsent?: boolean;
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({
    enum: ["new", "contacted", "plumber_assigned", "scheduled", "in_progress", "completed", "cancelled", "no_plumber_available"],
  })
  @IsEnum(["new", "contacted", "plumber_assigned", "scheduled", "in_progress", "completed", "cancelled", "no_plumber_available"])
  status!: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() note?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() assignedPlumberProfileId?: string;
}

export class AddServiceRequestNoteDto {
  @ApiProperty() @IsString() @Length(1, 2000) note!: string;
}
