import { Controller, Get } from "@nestjs/common";
import { Public } from "@vuteq/sso-client-nest";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  health() {
    return { data: { service: "itam-api", status: "ok", time: new Date().toISOString() } };
  }
}
