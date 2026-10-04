import { Controller, Get } from "@nestjs/common";
import { CurrentUser, type VuteqUser } from "@vuteq/sso-client-nest";
import { AuthorizationService } from "./authorization.service";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authorization: AuthorizationService) {}

  @Get("profile")
  async profile(@CurrentUser() user: VuteqUser) {
    return { data: await this.authorization.profile(user) };
  }
}
