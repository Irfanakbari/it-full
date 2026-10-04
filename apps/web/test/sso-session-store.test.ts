import { beforeEach, describe, expect, it, vi } from "vitest";

const values = new Map<string, string>();
vi.mock("ioredis", () => ({
  default: class FakeRedis {
    status = "ready";
    on() { return this; }
    async connect() {}
    async get(key: string) { return values.get(key) ?? null; }
    async set(key: string, value: string, ...args: string[]) { if (args.includes("NX") && values.has(key)) return null; values.set(key, value); return "OK"; }
    async del(...keys: string[]) { let count = 0; for (const key of keys) if (values.delete(key)) count += 1; return count; }
    async scan(cursor: string) { void cursor; return ["0", [...values.keys()].filter((key) => key.includes(":entry:"))]; }
    async eval(script: string, _count: number, key: string, token?: string) {
      if (script.startsWith("local v=")) {
        const value = values.get(key) ?? null;
        values.delete(key);
        return value;
      }
      if (token && values.get(key) === token) { values.delete(key); return 1; }
      return 0;
    }
  },
}));

describe("RedisSessionStore", () => {
  beforeEach(() => values.clear());
  it("sets TTL records, atomically takes them, matches logout sessions, and releases locks", async () => {
    const { ssoSessionStore: store } = await import("@/lib/sso-session-store");
    const session = { value: "sealed", expiresAt: Date.now() + 60_000, clientId: "itam", subject: "user-1", sid: "sid-1" };
    await store.set("one", session);
    expect(await store.get("one")).toEqual(session);
    expect(await store.take("one")).toEqual(session);
    expect(await store.take("one")).toBeNull();
    await store.set("two", session);
    expect(await store.deleteMatching("itam", "user-1", "sid-1")).toBe(1);
    expect(await store.withLock!("refresh", async () => "done")).toBe("done");
    expect([...values.keys()].some((key) => key.includes(":lock:"))).toBe(false);
  });
});
