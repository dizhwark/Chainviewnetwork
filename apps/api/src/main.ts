import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor";
import { BRAND } from "@maybe/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false, rawBody: true });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.WEB_BASE_URL ?? "http://localhost:3000"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  app.setGlobalPrefix("api/v1", { exclude: ["health"] });

  const config = new DocumentBuilder()
    .setTitle(`${BRAND.name} API`)
    .setDescription("Toronto plumbing-services marketplace — REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[${BRAND.name} API] listening on :${port} — docs at /docs`);
}

bootstrap();
