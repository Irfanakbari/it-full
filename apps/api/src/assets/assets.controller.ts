import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, StreamableFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CurrentUser, Permissions, type VuteqUser } from "@vuteq/sso-client-nest";
import type { Response } from "express";
import { actorContext } from "../common/actor";
import type { RequestWithContext } from "../common/api.types";
import type { BufferedUpload } from "../common/upload-security.util";
import { AssetQueryDto, AssignmentBodyDto, CreateAssetBodyDto, DisposalBodyDto, UpdateAssetBodyDto } from "./assets.dto";
import { AssetsService } from "./assets.service";

@Controller({ path: "assets", version: "1" })
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get() @Permissions("ITAM.ASSET_READ")
  list(@Query() query: AssetQueryDto) { return this.service.list(query); }

  @Get(":id") @Permissions("ITAM.ASSET_READ")
  detail(@Param("id") id: string) { return this.service.detail(Number(id)); }

  @Post() @Permissions("ITAM.ASSET_CREATE")
  create(@Body() body: CreateAssetBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) {
    return this.service.create(body, actorContext(request, user));
  }

  @Patch(":id") @Permissions("ITAM.ASSET_UPDATE")
  update(@Param("id") id: string, @Body() body: UpdateAssetBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) {
    return this.service.update(Number(id), body, actorContext(request, user));
  }

  @Delete(":id") @Permissions("ITAM.ASSET_ARCHIVE")
  archive(@Param("id") id: string, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) {
    return this.service.archive(Number(id), actorContext(request, user));
  }

  @Get(":id/attachments") @Permissions("ITAM.ASSET_READ")
  attachments(@Param("id") id: string) { return this.service.listAttachments(Number(id)); }

  @Post(":id/attachments") @Permissions("ITAM.ASSET_UPDATE")
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 10 * 1024 * 1024, files: 10, fields: 0, parts: 10 } }))
  uploadAttachments(
    @Param("id") id: string,
    @UploadedFiles() files: BufferedUpload[],
    @Req() request: RequestWithContext,
    @CurrentUser() user: VuteqUser,
  ) {
    return this.service.uploadAttachments(Number(id), files, actorContext(request, user));
  }

  @Get(":id/attachments/:attachmentId/download") @Permissions("ITAM.ASSET_READ")
  async downloadAttachment(
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const download = await this.service.downloadAttachment(Number(id), Number(attachmentId));
    response.setHeader("Content-Type", download.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(download.fileName)}`);
    response.setHeader("Content-Length", String(download.buffer.length));
    return new StreamableFile(download.buffer);
  }

  @Delete(":id/attachments/:attachmentId") @Permissions("ITAM.ASSET_UPDATE")
  deleteAttachment(
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string,
    @Req() request: RequestWithContext,
    @CurrentUser() user: VuteqUser,
  ) {
    return this.service.deleteAttachment(Number(id), Number(attachmentId), actorContext(request, user));
  }

  @Post(":id/dispose") @Permissions("ITAM.ASSET_DISPOSE")
  dispose(@Param("id") id: string, @Body() body: DisposalBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) {
    return this.service.dispose(Number(id), body, actorContext(request, user));
  }
}

@Controller({ path: "asset-user-assignments", version: "1" })
export class AssetUserAssignmentsController {
  constructor(private readonly service: AssetsService) {}
  @Get() @Permissions("ITAM.ASSET_READ")
  list(@Query() query: AssetQueryDto) { return this.service.assignmentList(query); }
  @Post() @Permissions("ITAM.ASSET_ASSIGN")
  create(@Body() body: AssignmentBodyDto, @Req() request: RequestWithContext, @CurrentUser() user: VuteqUser) {
    return this.service.assignUser(body, actorContext(request, user));
  }
}

@Controller({ path: "disposals", version: "1" })
export class DisposalsController {
  constructor(private readonly service: AssetsService) {}
  @Get() @Permissions("ITAM.ASSET_READ")
  list(@Query() query: AssetQueryDto) { return this.service.disposalList(query); }
}
