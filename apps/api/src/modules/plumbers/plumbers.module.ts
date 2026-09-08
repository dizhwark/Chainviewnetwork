import { Module } from "@nestjs/common";
import { PlumbersController } from "./plumbers.controller";
import { PlumbersService } from "./plumbers.service";

@Module({
  controllers: [PlumbersController],
  providers: [PlumbersService],
  exports: [PlumbersService],
})
export class PlumbersModule {}
