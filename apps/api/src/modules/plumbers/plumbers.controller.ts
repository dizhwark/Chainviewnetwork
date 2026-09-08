import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotFoundException } from "@nestjs/common";
import { PlumbersService } from "./plumbers.service";

@ApiTags("plumbers")
@Controller("plumbers")
export class PlumbersController {
  constructor(private readonly service: PlumbersService) {}

  @Get()
  browse(@Query("category") category?: string, @Query("page") page = "1", @Query("pageSize") pageSize = "20") {
    return this.service.browsePublic({ categorySlug: category, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get(":id")
  async getProfile(@Param("id") id: string) {
    const profile = await this.service.getPublicProfile(id);
    if (!profile) throw new NotFoundException("Plumber not found");
    return profile;
  }
}
