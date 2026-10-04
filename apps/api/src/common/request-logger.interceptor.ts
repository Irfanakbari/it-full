import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { finalize, type Observable } from "rxjs";
import type { Response } from "express";
import type { RequestWithContext } from "./api.types";

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      finalize(() => {
        this.logger.log({
          service: "itam-api",
          method: request.method,
          route: request.route?.path ?? request.path,
          status: response.statusCode,
          durationMs: Date.now() - started,
          requestId: request.requestId,
          actorSource: request.auth?.user || request.actor ? "SSO" : "SYSTEM",
        });
      }),
    );
  }
}
