import type { VuteqUser } from "@vuteq/sso-client-nest";
import type { ActorContext, RequestWithContext } from "./api.types";

export function actorContext(
  request: RequestWithContext,
  user?: VuteqUser,
): ActorContext {
  const Actor = user?.id ?? "System";
  request.actor = Actor;
  return {
    Actor,
    ActorSource: user ? "SSO" : "SYSTEM",
    RequestId: request.requestId,
  };
}
