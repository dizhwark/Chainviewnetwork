import { Module } from "@nestjs/common";
import { ServiceZonesController } from "./service-zones.controller";
import { GeocodingModule } from "../geocoding/geocoding.module";

@Module({
  imports: [GeocodingModule],
  controllers: [ServiceZonesController],
})
export class ServiceZonesModule {}
