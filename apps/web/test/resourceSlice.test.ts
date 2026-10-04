import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import reducer, { fetchResource, patchQuery, selectResource } from "@/store/resourceSlice";

describe("resource query state", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("isolates resources and supports a server-side filter page reset", () => {
    const store = configureStore({ reducer: { resource: reducer } });
    store.dispatch(selectResource({ key: "assets" }));
    store.dispatch(patchQuery({ page: 4, sortBy: "AssetTag", sortOrder: "desc" }));
    store.dispatch(patchQuery({ page: 1, filters: { AssetTag: "VTQ" } }));
    expect(store.getState().resource.query).toMatchObject({ page: 1, sortBy: "AssetTag", sortOrder: "desc", filters: { AssetTag: "VTQ" } });
    store.dispatch(selectResource({ key: "categories" }));
    expect(store.getState().resource.query).toEqual({ page: 1, limit: 50, filters: {} });
  });

  it("coalesces duplicate in-flight list requests", async () => {
    let release: (() => void) | undefined;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const fetchMock = vi.fn(async () => {
      await wait;
      return new Response(JSON.stringify({ success: true, message: "OK", data: [], meta: { totalItems: 0 } }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = configureStore({ reducer: { resource: reducer } });
    store.dispatch(selectResource({ key: "assets" }));
    const args = { endpoint: "assets", query: store.getState().resource.query };
    const first = store.dispatch(fetchResource(args));
    const duplicate = await store.dispatch(fetchResource(args));
    expect("condition" in duplicate.meta && duplicate.meta.condition).toBe(true);
    release?.();
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
