"use client";

import { useVuteqSso } from "@vuteq/sso-client-react/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

const APP_VERSION = "1.0.0";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useVuteqSso();
  const loginPath = withBasePath("/auth/login");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      window.location.replace(loginPath);
      return;
    }
    const profile = session.attributes as { AccessStatus?: string; RoleName?: string } | undefined;
    const isGlobalSuper =
      (session.roles ?? []).includes("SUPER_ADMINISTRATOR") ||
      (session.globalRoles ?? []).includes("SUPER_ADMINISTRATOR");
    const isGlobalRoAdmin =
      (session.roles ?? []).includes("RO_ADMINISTRATOR") ||
      (session.globalRoles ?? []).includes("RO_ADMINISTRATOR");

    const hasRole = Boolean(session.roles.length > 0 || profile?.RoleName || isGlobalRoAdmin);
    if (!isGlobalSuper && !isGlobalRoAdmin && (profile?.AccessStatus === "PENDING" || !hasRole)) {
      router.replace("/auth/pending-account");
    } else if (isGlobalSuper || isGlobalRoAdmin || profile?.AccessStatus === "ACTIVE" || hasRole) {
      router.replace("/apps");
    } else {
      router.replace("/auth/error");
    }
  }, [loading, loginPath, router, session]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <Image
        src={withBasePath("/images/ansei-white.png")}
        alt="ITAM logo"
        width={180}
        height={90}
        priority
        className="mb-4"
      />
      <p className="text-sm text-slate-300">Redirecting to Vuteq SSO...</p>
      <a
        className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
        href={loginPath}
      >
        Continue to sign in
      </a>
      <span className="mt-2 text-xs text-slate-500">v{APP_VERSION}</span>
    </main>
  );
}
