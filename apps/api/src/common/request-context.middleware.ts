import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import { randomUUID } from "node:crypto";
import type { RequestWithContext } from "./api.types";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction) {
    const supplied = request.header("x-request-id")?.trim();
    request.requestId = supplied && supplied.length <= 128 ? supplied : randomUUID();
    response.setHeader("x-request-id", request.requestId);
    next();
  }
}
