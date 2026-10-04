"use client";

import Image from "next/image";
import { useEffect } from "react";

const APP_VERSION = "1.0.0";

export default function LoginPage() {
  useEffect(() => {
    window.location.replace("/auth/login");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <Image
        src="/images/ansei-white.png"
        alt="ITAM logo"
        width={180}
        height={90}
        priority
        className="mb-4"
      />
      <p className="text-sm text-slate-300">Redirecting to Vuteq SSO...</p>
      <a
        className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
        href="/auth/login"
      >
        Continue to sign in
      </a>
      <span className="mt-2 text-xs text-slate-500">v{APP_VERSION}</span>
    </main>
  );
}
