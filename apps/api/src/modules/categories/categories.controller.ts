import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../common/prisma/prisma.service";

@ApiTags("categories")
@Controller("service-categories")
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }
}
