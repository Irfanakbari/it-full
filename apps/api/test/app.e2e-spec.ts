import { ValidationPipe, VersioningType } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { VuteqSsoGuard } from "@vuteq/sso-client-nest";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { ResponseInterceptor } from "../src/common/response.interceptor";
import { PrismaService } from "../src/prisma/prisma.service";

jest.mock("@vuteq/sso-client-nest", () => {
  const nest = jest.requireActual<typeof import("@nestjs/common")>(
    "@nestjs/common",
  );
  class MockVuteqSsoGuard {
    canActivate() {
      return true;
    }
  }
  class MockVuteqSsoModule {
    static forRootAsync() {
      return { module: MockVuteqSsoModule };
    }
  }
  return {
    VuteqSsoGuard: MockVuteqSsoGuard,
    VuteqSsoModule: MockVuteqSsoModule,
    Public: () => nest.SetMetadata("vuteq:public", true),
    Permissions: (...permissions: string[]) =>
      nest.SetMetadata("vuteq:permissions", permissions),
    CurrentUser: nest.createParamDecorator(
      (_data: unknown, context: import("@nestjs/common").ExecutionContext) =>
        context.switchToHttp().getRequest().user,
    ),
  };
});

describe("ITAM API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(VuteqSsoGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("connects to the migrated PostgreSQL baseline", async () => {
    const prisma = app.get(PrismaService);
    await expect(prisma.asset.count()).resolves.toEqual(expect.any(Number));
  });

  it("returns the standard success envelope with a request ID", async () => {
    const response = await request(app.getHttpServer())
      .get("/v1/health")
      .set("x-request-id", "e2e-health-request")
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      requestId: "e2e-health-request",
      data: { service: "itam-api", status: "ok" },
    });
  });

  it("paginates and sorts assets on the server", async () => {
    const response = await request(app.getHttpServer())
      .get("/v1/assets")
      .query({ page: 1, limit: 1, sortBy: "AssetTag", sortOrder: "asc" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1 });
    expect(typeof response.body.meta.totalItems).toBe("number");
  });

  it("returns a sanitized validation envelope", async () => {
    const response = await request(app.getHttpServer())
      .get("/v1/assets")
      .query({ limit: 101, unexpected: "not-allowed" })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toMatch(/stack|postgres|select /i);
  });
});
