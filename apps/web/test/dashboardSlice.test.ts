import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import reducer, { fetchDashboard } from "@/store/dashboardSlice";

describe("dashboard requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("coalesces duplicate in-flight dashboard requests", async () => {
    let release: (() => void) | undefined;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const fetchMock = vi.fn(async () => {
      await wait;
      return new Response(JSON.stringify({ data: { Kpi: {}, Condition: {}, CategoryDistribution: [], LocationDistribution: [], RecentAssets: [], RecentMaintenance: [], ActiveStockOpname: null, AssetTrend: [], MaintenanceTrend: [] } }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = configureStore({ reducer: { dashboard: reducer } });
    const first = store.dispatch(fetchDashboard());
    const duplicate = await store.dispatch(fetchDashboard());
    expect("condition" in duplicate.meta && duplicate.meta.condition).toBe(true);
    release?.();
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
