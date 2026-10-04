import "server-only";
import { createNextVuteqSso } from "@vuteq/sso-client-react/next";
import { withBasePath } from "./base-path";
import { ssoSessionStore } from "./sso-session-store";

export const sso = createNextVuteqSso({
  baseUrl: process.env.VUTEQ_SSO_BASE_URL ?? "https://sso.vuteq.co.id",
  // A non-secret build placeholder prevents Next.js route collection from
  // contacting SSO. Real requests still fail closed until the environment is set.
  secret: process.env.VUTEQ_SSO_SECRET ?? "missing-secret-not-configured",
  publicOrigin: process.env.VUTEQ_SSO_PUBLIC_ORIGIN,
  store: ssoSessionStore,
  callbackPath: withBasePath("/auth/callback"),
  homePath: withBasePath("/apps"),
  errorPath: withBasePath("/auth/error"),
  cookieName: "itam_session",
  trustProxy: process.env.VUTEQ_SSO_TRUST_PROXY === "true",
  onCallbackError: (diagnostic) => console.error(JSON.stringify({ event: "sso_callback_failed", service: "itam-web", ...diagnostic })),
});
