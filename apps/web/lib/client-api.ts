export async function bffRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/proxy/v1/${path}`, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => null) as ({ message?: string } & T) | null;
  if (!response.ok || !body) throw new Error(body?.message ?? "Request failed");
  return body;
}
