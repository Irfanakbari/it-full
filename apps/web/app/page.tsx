"use client";

import Image from "next/image";
import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

const APP_VERSION = "1.0.0";

export default function LoginPage() {
  const loginPath = withBasePath("/auth/login");

  useEffect(() => {
    window.location.replace(loginPath);
  }, [loginPath]);

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
