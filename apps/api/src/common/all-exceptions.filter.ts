import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { VuteqAuthenticationError, VuteqConfigurationError } from "@vuteq/sso-client-nest";
import type { RequestWithContext } from "./api.types";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An internal error occurred";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === "string") message = payload;
      else if (payload && typeof payload === "object") {
        const body = payload as Record<string, unknown>;
        const rawMessage = body.message;
        if (Array.isArray(rawMessage)) {
          message = "Validation failed";
          details = rawMessage;
          code = "VALIDATION_ERROR";
        } else if (typeof rawMessage === "string") message = rawMessage;
        if (typeof body.code === "string") code = body.code;
      }
      if (code === "INTERNAL_ERROR") code = `HTTP_${status}`;
    } else if (exception instanceof VuteqAuthenticationError) {
      status = HttpStatus.UNAUTHORIZED;
      code = "AUTHENTICATION_REQUIRED";
      message = "Authentication is required";
    } else if (exception instanceof VuteqConfigurationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      code = "SSO_UNAVAILABLE";
      message = "The identity service is temporarily unavailable";
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        code = "DUPLICATE_RECORD";
        message = "A record with the same unique value already exists";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "The requested record was not found";
      }
    }

    if (status >= 500) {
      this.logger.error({
        message: exception instanceof Error ? exception.message : "Unknown error",
        requestId: request.requestId,
        method: request.method,
        route: request.route?.path ?? request.path,
      });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      data: null,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      requestId: request.requestId,
    });
  }
}
