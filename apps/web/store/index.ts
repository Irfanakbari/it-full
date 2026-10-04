import { configureStore } from "@reduxjs/toolkit";
import resourceReducer from "./resourceSlice";
import dashboardReducer from "./dashboardSlice";
import authReducer from "./features/auth/authSlice";

export const store = configureStore({ reducer: { auth: authReducer, resource: resourceReducer, dashboard: dashboardReducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
