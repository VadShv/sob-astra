import axios, { type AxiosInstance } from "axios";

export const API_BASE_URL = "https://api.sobesso.ru";
export const APP_BASE_URL = "https://app.sobesso.ru";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface User {
  id: string;
  email: string;
  role: string;
  companyId?: string;
}

export interface LoginResponse {
  twoFactorRequired?: boolean;
  challengeId?: string;
  email?: string;
}

export interface Challenge {
  challengeId: string;
  email: string;
}

export interface CodeResponse {
  emailSent: boolean;
  email: string;
}

export interface ApiError {
  message?: string;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
  response?: { status?: number };
}

export const authApi = {
  async me(): Promise<User> {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },

  async loginWithPassword(payload: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload
    );
    return data;
  },

  async loginWithCode(payload: {
    challengeId: string;
    code: string;
  }): Promise<User> {
    const { data } = await apiClient.post<User>("/auth/login/code", payload);
    return data;
  },

  async resendLoginCode(payload: {
    challengeId: string;
  }): Promise<CodeResponse> {
    const { data } = await apiClient.post<CodeResponse>(
      "/auth/login/code/resend",
      payload
    );
    return data;
  },

  async sendMagicLink(payload: { email: string }): Promise<void> {
    await apiClient.post("/auth/magic-link", payload);
  },

  hhAuthUrl(): string {
    return `${API_BASE_URL}/auth/hh`;
  },
};
