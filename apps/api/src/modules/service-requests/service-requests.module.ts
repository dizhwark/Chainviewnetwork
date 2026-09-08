import { Module } from "@nestjs/common";
import { ServiceRequestsController } from "./service-requests.controller";
import { ServiceRequestsService } from "./service-requests.service";
import { GeocodingModule } from "../geocoding/geocoding.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { PlumbersModule } from "../plumbers/plumbers.module";

@Module({
  imports: [GeocodingModule, NotificationsModule, AnalyticsModule, PlumbersModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
