import { Module } from "@nestjs/common";
import { PlumberApplicationsController } from "./plumber-applications.controller";
import { PlumberApplicationsService } from "./plumber-applications.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PlumberApplicationsController],
  providers: [PlumberApplicationsService],
})
export class PlumberApplicationsModule {}
