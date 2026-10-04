import {
  CallHandler,
  ExecutionContext,
  Injectable,
  StreamableFile,
  NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type { Response } from "express";
import type { RequestWithContext, ServiceResult } from "./api.types";

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T | ServiceResult<T>, unknown>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    return next.handle().pipe(
      map((result: T | ServiceResult<T>) => {
        if (result instanceof StreamableFile) return result;
        const wrapped =
          result && typeof result === "object" && "data" in result
            ? (result as ServiceResult<T>)
            : { data: result as T };
        return {
          success: true,
          statusCode: response.statusCode,
          message: wrapped.message ?? "Request completed successfully",
          data: wrapped.data ?? null,
          ...(wrapped.meta ? { meta: wrapped.meta } : {}),
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
          requestId: request.requestId,
        };
      }),
    );
  }
}
