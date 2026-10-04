import { toClientSession } from "@vuteq/sso-client-react";
import { apiFetch, dependencyUnavailable } from "@/lib/server-api";
import { sso } from "@/lib/sso";

export const dynamic = "force-dynamic";

type ProfileEnvelope = { data?: { LocalRole?: string | null; Permissions?: string[] } };
type ProfileResult = { ok: boolean; status: number; envelope?: ProfileEnvelope };
const profileRequests = new Map<string, Promise<ProfileResult>>();

async function loadProfile(request: Request, subject: string): Promise<ProfileResult> {
  const active = profileRequests.get(subject);
  if (active) return active;

  const pending = (async () => {
    const response = await apiFetch(request, "/v1/auth/profile");
    return {
      ok: response.ok,
      status: response.status,
      envelope: response.ok ? await response.json() as ProfileEnvelope : undefined,
    };
  })();
  profileRequests.set(subject, pending);
  try {
    return await pending;
  } finally {
    if (profileRequests.get(subject) === pending) profileRequests.delete(subject);
  }
}

export async function GET(request: Request) {
  const session = await sso.session(request);
  if (!session) {
    const headers = new Headers({ "Cache-Control": "no-store" });
    headers.append(
      "Set-Cookie",
      "__Host-itam_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    );
    headers.append(
      "Set-Cookie",
      "itam_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    return Response.json(null, { headers });
  }
  try {
    const profile = await loadProfile(request, session.profile.sub);
    if (!profile.ok) {
      if (profile.status >= 500) return dependencyUnavailable("/api/auth/session");
      return Response.json(null, { status: profile.status, headers: { "Cache-Control": "no-store" } });
    }
    const safe = toClientSession(session, {
      roles: profile.envelope?.data?.LocalRole ? [profile.envelope.data.LocalRole] : [],
      permissions: profile.envelope?.data?.Permissions ?? [],
    });
    return Response.json(safe, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return dependencyUnavailable("/api/auth/session");
  }
}
