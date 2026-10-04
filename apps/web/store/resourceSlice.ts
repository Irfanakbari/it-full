import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { bffRequest } from "@/lib/client-api";

export type QueryState = { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; filters: Record<string, string | number | boolean | undefined> };
type ResourceState = { key: string; items: Record<string, unknown>[]; query: QueryState; totalItems: number; loading: boolean; error: string | null };
const initialState: ResourceState = { key: "", items: [], query: { page: 1, limit: 50, filters: {} }, totalItems: 0, loading: false, error: null };

type Envelope = { success: boolean; message: string; data: Record<string, unknown>[]; meta?: { totalItems: number } };

export const fetchResource = createAsyncThunk<Envelope, { endpoint: string; query: QueryState }, { state: { resource: ResourceState } }>("resource/fetch", async ({ endpoint, query }) => {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit), sortOrder: query.sortOrder ?? "asc" });
  if (query.search) params.set("search", query.search);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  Object.entries(query.filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return bffRequest<Envelope>(`${endpoint}?${params}`);
}, { condition: ({ endpoint }, { getState }) => { const resource = getState().resource; return resource.key !== endpoint || !resource.loading; } });

export const mutateResource = createAsyncThunk("resource/mutate", async ({ endpoint, method, body }: { endpoint: string; method: "POST" | "PATCH" | "DELETE"; body?: unknown }) => {
  return bffRequest<{ message: string; data: unknown }>(endpoint, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
});

const slice = createSlice({
  name: "resource", initialState,
  reducers: {
    selectResource(state, action: PayloadAction<{ key: string; query?: Partial<QueryState> }>) { if (state.key !== action.payload.key) { state.key = action.payload.key; state.items = []; state.totalItems = 0; state.error = null; state.query = { page: 1, limit: 50, filters: {}, ...action.payload.query }; } },
    patchQuery(state, action: PayloadAction<Partial<QueryState>>) { state.query = { ...state.query, ...action.payload, filters: action.payload.filters ?? state.query.filters }; },
  },
  extraReducers: (builder) => builder
    .addCase(fetchResource.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchResource.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.data; state.totalItems = action.payload.meta?.totalItems ?? action.payload.data.length; })
    .addCase(fetchResource.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? "Request failed"; }),
});
export const { selectResource, patchQuery } = slice.actions;
export default slice.reducer;
