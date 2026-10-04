import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { bffRequest } from "@/lib/client-api";
export type DashboardData = { Kpi: Record<string, number>; Condition: Record<string, number>; CategoryDistribution: { Name: string; Total: number }[]; LocationDistribution: { Name: string; Total: number }[]; RecentAssets: Record<string, unknown>[]; RecentMaintenance: Record<string, unknown>[]; ActiveStockOpname: Record<string, unknown> | null; AssetTrend: { Month: string; Total: number }[]; MaintenanceTrend: { Month: string; Total: number }[] };
type DashboardState = { data: DashboardData | null; loading: boolean; error: string | null };
const initialState: DashboardState = { data: null, loading: false, error: null };
export const fetchDashboard = createAsyncThunk<DashboardData, void, { state: { dashboard: DashboardState } }>("dashboard/fetch", async () => { const body = await bffRequest<{ data: DashboardData }>("dashboard"); return body.data; }, { condition: (_argument, { getState }) => !getState().dashboard.loading });
const slice = createSlice({ name: "dashboard", initialState, reducers: {}, extraReducers: (builder) => builder.addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; }).addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; }).addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? "Dashboard request failed"; }) });
export default slice.reducer;
