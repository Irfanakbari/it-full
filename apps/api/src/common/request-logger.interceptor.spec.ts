import { Logger, type CallHandler, type ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import type { RequestWithContext } from "./api.types";
import { RequestLoggerInterceptor } from "./request-logger.interceptor";

function contextFor(request: Partial<RequestWithContext>, statusCode = 200) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ statusCode }),
    }),
  } as ExecutionContext;
}

describe("RequestLoggerInterceptor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("identifies authenticated read requests from the SDK auth context", async () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const interceptor = new RequestLoggerInterceptor();
    const request = {
      method: "GET",
      path: "/v1/assets",
      requestId: "request-sso",
      auth: { user: { id: "sso-user" } },
    } as Partial<RequestWithContext>;

    await lastValueFrom(interceptor.intercept(contextFor(request), { handle: () => of(null) } as CallHandler));

    expect(log).toHaveBeenCalledWith(expect.objectContaining({ actorSource: "SSO", requestId: "request-sso" }));
  });

  it("keeps unauthenticated public requests marked as system", async () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const interceptor = new RequestLoggerInterceptor();
    const request = { method: "GET", path: "/v1/health", requestId: "request-system" } as Partial<RequestWithContext>;

    await lastValueFrom(interceptor.intercept(contextFor(request), { handle: () => of(null) } as CallHandler));

    expect(log).toHaveBeenCalledWith(expect.objectContaining({ actorSource: "SYSTEM", requestId: "request-system" }));
  });
});
