import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  UserId: string;
  Name: string;
  Email: string;
  LastLogin: string;
  DeptPermission: string[];
  RoleName: string;
  Permission: string[];
  GlobalRoles?: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
  },
});

export const { setAuthData, clearAuth } = authSlice.actions;
export default authSlice.reducer;
