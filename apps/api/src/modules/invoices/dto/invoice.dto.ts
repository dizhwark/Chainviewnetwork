import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";

class InvoiceLineItemDto {
  @ApiProperty() @IsString() description!: string;
  @ApiProperty({ enum: ["labour", "materials", "fee"] }) @IsIn(["labour", "materials", "fee"]) kind!: string;
  @ApiProperty() @IsNumber() @Min(0.01) quantity!: number;
  @ApiProperty() @IsInt() @Min(0) unitPriceCents!: number;
  @ApiProperty({ required: false, default: true }) @IsOptional() @IsBoolean() taxable?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class CreateManualInvoiceDto {
  @ApiProperty() @IsUUID() serviceRequestId!: string;

  @ApiProperty({ type: [InvoiceLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems!: InvoiceLineItemDto[];

  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsInt() @Min(0) discountCents?: number;
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean() isEmergency?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
