import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditModule } from "./common/audit/audit.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FilesModule } from "./modules/files/files.module";
import { GeocodingModule } from "./modules/geocoding/geocoding.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ServiceZonesModule } from "./modules/service-zones/service-zones.module";
import { ServiceRequestsModule } from "./modules/service-requests/service-requests.module";
import { PlumbersModule } from "./modules/plumbers/plumbers.module";
import { PlumberApplicationsModule } from "./modules/plumber-applications/plumber-applications.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { AppSettingsModule } from "./modules/app-settings/app-settings.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { FeatureFlagsModule } from "./modules/feature-flags/feature-flags.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    FilesModule,
    GeocodingModule,
    CategoriesModule,
    ServiceZonesModule,
    PlumbersModule,
    ServiceRequestsModule,
    PlumberApplicationsModule,
    ReviewsModule,
    AppSettingsModule,
    InvoicesModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    FeatureFlagsModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
