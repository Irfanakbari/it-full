import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthorizationService } from "./authorization.service";

@Module({
  controllers: [AuthController],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthModule {}
