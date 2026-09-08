import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { haversineKm } from "@maybe/shared";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GeocodingService } from "../geocoding/geocoding.service";

class CoverageCheckQuery {
  @IsString()
  postalCode!: string;
}

@ApiTags("service-zones")
@Controller("service-zones")
export class ServiceZonesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

  @Get()
  async list() {
    return this.prisma.serviceZone.findMany({ where: { active: true } });
  }

  /**
   * Public coverage check used on the homepage/landing page. Matches by
   * postal-code prefix first (fast, no geocode needed); falls back to a
   * radius check via the map provider if no prefix matches.
   */
  @Get("coverage-check")
  async coverageCheck(@Query() query: CoverageCheckQuery) {
    const postal = query.postalCode.replace(/\s/g, "").toUpperCase();
    const zones = await this.prisma.serviceZone.findMany({ where: { active: true } });

    const prefixMatch = zones.find((z) => z.postalPrefixes.some((p) => postal.startsWith(p.toUpperCase())));
    if (prefixMatch) {
      return { covered: true, zone: { id: prefixMatch.id, name: prefixMatch.name }, method: "postal_prefix" };
    }

    const geocoded = await this.geocoding.geocode({ line1: "", city: "Toronto", province: "ON", postalCode: postal });
    const radiusMatch = zones.find(
      (z) => haversineKm({ lat: z.centerLat, lng: z.centerLng }, geocoded) <= z.radiusKm,
    );
    if (radiusMatch) {
      return {
        covered: true,
        zone: { id: radiusMatch.id, name: radiusMatch.name },
        method: "radius",
        approximate: geocoded.approximate,
      };
    }

    return { covered: false, zone: null };
  }
}
