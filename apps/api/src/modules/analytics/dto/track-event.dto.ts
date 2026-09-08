import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { ANALYTICS_EVENTS } from "@maybe/shared";

export class TrackEventDto {
  @ApiProperty({ enum: ANALYTICS_EVENTS })
  @IsIn(ANALYTICS_EVENTS)
  eventName!: (typeof ANALYTICS_EVENTS)[number];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
