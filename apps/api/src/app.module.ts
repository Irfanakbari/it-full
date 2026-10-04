import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VuteqSsoModule } from "@vuteq/sso-client-nest";
import { AdminModule } from "./admin/admin.module";
import { AssetsModule } from "./assets/assets.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { AuthorizationService } from "./auth/authorization.service";
import { RequestContextMiddleware } from "./common/request-context.middleware";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmployeeDirectoryModule } from "./employee-directory/employee-directory.module";
import { HealthController } from "./health.controller";
import { MasterModule } from "./master/master.module";
import { OperationsModule } from "./operations/operations.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    VuteqSsoModule.forRootAsync({
      global: true,
      imports: [AuthModule],
      inject: [AuthorizationService],
      useFactory: (authorization: AuthorizationService) => ({
        baseUrl: process.env.VUTEQ_SSO_BASE_URL ?? "https://sso.vuteq.co.id",
        secret: process.env.VUTEQ_SSO_SECRET ?? "",
        allowedClientIds: process.env.VUTEQ_SSO_ALLOWED_CLIENT_IDS?.split(",").map((item) => item.trim()).filter(Boolean),
        resolveAuthorization: (identity, claims) => authorization.resolve(identity, claims),
      }),
    }),
    MasterModule,
    EmployeeDirectoryModule,
    AssetsModule,
    OperationsModule,
    AdminModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
