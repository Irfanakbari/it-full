import type { Request } from "express";
import type { VuteqAuthContext } from "@vuteq/sso-client-nest";

export type RequestWithContext = Request & {
  requestId: string;
  actor?: string;
  auth?: VuteqAuthContext;
};

export type PageMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type ServiceResult<T> = {
  data: T;
  message?: string;
  meta?: PageMeta;
};

export type ActorContext = {
  Actor: string;
  ActorSource: "SSO" | "SYSTEM";
  RequestId: string;
};
