import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AnalyticsService } from "./analytics.service";
import { TrackEventDto } from "./dto/track-event.dto";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Client-side funnel events (landing_page_visit, address_submitted, etc.).
   * No PII/free-text is accepted — sanitizeAnalyticsProperties strips
   * anything outside the allow-listed property keys before storage.
   */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("events")
  async track(@Body() dto: TrackEventDto) {
    await this.analytics.track(dto.eventName, dto.properties ?? {}, { sessionId: dto.sessionId });
    return { ok: true };
  }
}
