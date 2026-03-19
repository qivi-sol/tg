import type {
  AuthResponse,
  DashboardResponse,
  DevTelegramProfile
} from "../types/game";
import { invokeEdge } from "./api";

interface LoginPayload {
  initData: string;
  startParam: string | null;
  devUser?: DevTelegramProfile;
}

export const authService = {
  login: (payload: LoginPayload) =>
    invokeEdge<AuthResponse>("telegram-auth", {
      body: {
        initData: payload.initData,
        startParam: payload.startParam,
        devUser: payload.devUser
      }
    }),
  bootstrap: (token: string) =>
    invokeEdge<DashboardResponse>("app-bootstrap", {
      token
    })
};
