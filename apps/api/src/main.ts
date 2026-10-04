import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { RequestLoggerInterceptor } from "./common/request-logger.interceptor";
import { ResponseInterceptor } from "./common/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalInterceptors(new RequestLoggerInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.SWAGGER_ENABLED === "true") {
    const config = new DocumentBuilder().setTitle("IT Asset Management API").setVersion("1.0").addBearerAuth().build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.PORT ?? 7600);
  await app.listen(port, "0.0.0.0");
  Logger.log(`ITAM API listening on ${port}`, "Bootstrap");
}

void bootstrap();
