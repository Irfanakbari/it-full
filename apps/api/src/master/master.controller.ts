import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { CurrentUser, Permissions, type VuteqUser } from "@vuteq/sso-client-nest";
import { actorContext } from "../common/actor";
import type { RequestWithContext } from "../common/api.types";
import { MasterBodyDto, MasterQueryDto } from "./master.dto";
import { MasterService, type MasterResource } from "./master.service";

export abstract class MasterControllerBase {
  protected abstract readonly resource: MasterResource;
  constructor(protected readonly service: MasterService) {}

  @Get()
  @Permissions("ITAM.MASTER_READ")
  list(@Query() query: MasterQueryDto) {
    return this.service.list(this.resource, query);
  }

  @Get(":id")
  @Permissions("ITAM.MASTER_READ")
  detail(@Param("id") id: string) {
    return this.service.detail(this.resource, id);
  }

  @Post()
  @Permissions("ITAM.MASTER_MANAGE")
  create(
    @Body() body: MasterBodyDto,
    @Req() request: RequestWithContext,
    @CurrentUser() user: VuteqUser,
  ) {
    return this.service.create(this.resource, body, actorContext(request, user));
  }

  @Patch(":id")
  @Permissions("ITAM.MASTER_MANAGE")
  update(
    @Param("id") id: string,
    @Body() body: MasterBodyDto,
    @Req() request: RequestWithContext,
    @CurrentUser() user: VuteqUser,
  ) {
    return this.service.update(this.resource, id, body, actorContext(request, user));
  }

  @Delete(":id")
  @Permissions("ITAM.MASTER_MANAGE")
  archive(
    @Param("id") id: string,
    @Req() request: RequestWithContext,
    @CurrentUser() user: VuteqUser,
  ) {
    return this.service.archive(this.resource, id, actorContext(request, user));
  }
}
