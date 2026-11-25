import axios, { type AxiosInstance, type AxiosError } from "axios";

export const API_BASE_URL = "/proxy";
export const REAL_API_BASE_URL = "https://api.sobesso.ru";
export const APP_BASE_URL = "https://app.sobesso.ru";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; attemptsLeft?: number; retryAfterSeconds?: number }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.response?.status === 401) return "Необходима авторизация";
    if (error.response?.status === 403) return "Недостаточно прав";
    if (error.response?.status === 404) return "Не найдено";
    if (error.response?.status === 429) return "Слишком много запросов";
    if (error.response?.status && error.response.status >= 500) return "Ошибка сервера";
  }
  return "Произошла ошибка";
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  companyId?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export interface UserDetails {
  id: string;
  email: string;
  name: string;
  isHrAdmin: boolean;
  company: {
    CompanyIntegration: { integrationType: string }[];
    AvailableIntegration: { integrationType: string }[];
    integrationType: string;
    productMode: string;
    multiVacancyAsOne: boolean;
  };
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

export interface VacancyStageCount {
  stageId: string;
  name: string;
  purpose: string;
  enabled: boolean;
  count: number;
}

export interface Vacancy {
  id: string;
  title: string;
  multiVacancy: unknown;
  stageTypes: string[];
  interviewsCount: number;
  stageCounts: VacancyStageCount[];
  awaitingDecisionCount: number;
  hrName: string;
  hrId: string;
  status: string;
  statusLabel: string;
  statusUpdatedAt: string;
  searchStartedAt: string;
  hiredCount: number;
  plannedHires: number;
  hhReconnectRequired: boolean;
  isConfidential: boolean;
  orgUnit?: { id: string; name: string };
  recruiters?: { id: string; name: string }[];
  SourceIntegrationVacancy?: { integrationType: string };
  TransportIntegrationVacancy?: { integrationType: string };
  SinkIntegrationVacancy?: { integrationType: string };
}

export interface VacancyFacets {
  total: number;
  recruiters: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  statuses: { value: string; label: string; count: number }[];
}

export interface HiringKpi {
  timeToFill: { medianDays: number | null; positions: number; vacancies: number };
  timeToOffer: { medianDays: number | null; offers: number };
  offerAcceptance: { rate: number | null; accepted: number; declined: number };
  hiringSpeed: { unit: string; points: { from: string; to: string }[] };
}

export interface Candidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  passport?: {
    title?: string;
    company?: string;
    salary?: number;
    area?: string;
    photoUrl?: string;
    age?: number;
  };
  resume?: {
    sourceType?: string;
    candidateSource?: { id: string; name: string };
    lastPosition?: string;
    skills?: string[];
  };
  processCount?: number;
  activeProcessCount?: number;
  foundAwaitingCount?: number;
  tags?: { id: string; name: string; color?: string }[];
  createdAt?: string;
}

export const authApi = {
  async me(): Promise<{ user: User | null }> {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },
  async loginWithPassword(payload: { email: string; password: string }): Promise<LoginResponse> {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  },
  async loginWithCode(payload: { challengeId: string; code: string }): Promise<User> {
    const { data } = await apiClient.post("/auth/login/code", payload);
    return data;
  },
  async resendLoginCode(payload: { challengeId: string }): Promise<CodeResponse> {
    const { data } = await apiClient.post("/auth/login/code/resend", payload);
    return data;
  },
  async sendMagicLink(payload: { email: string }): Promise<void> {
    await apiClient.post("/auth/magic-link", payload);
  },
  hhAuthUrl(): string {
    return `${REAL_API_BASE_URL}/auth/hh`;
  },
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};

export const appApi = {
  async getCurrentTime(): Promise<{ currentTimeMs: number }> {
    const { data } = await apiClient.get("/api/time/current");
    return data;
  },
  async getUser(): Promise<UserDetails> {
    const { data } = await apiClient.get("/api/user");
    return data;
  },
  async getCompanyRoles(): Promise<unknown> {
    const { data } = await apiClient.get("/api/company-roles/me");
    return data;
  },
  async getUnreadCount(): Promise<{ count: number }> {
    const { data } = await apiClient.get("/api/notifications/unread-count");
    return data;
  },
  async getAwaitingCount(): Promise<{ count: number }> {
    const { data } = await apiClient.get("/api/conversations/awaiting/count");
    return data;
  },
  async getVacancies(params?: Record<string, string>): Promise<{ items: Vacancy[]; total?: number }> {
    const { data } = await apiClient.get("/api/vacancy/all", { params });
    return data;
  },
  async getVacancyFacets(params?: Record<string, string>): Promise<VacancyFacets> {
    const { data } = await apiClient.get("/api/vacancy/all/facets", { params });
    return data;
  },
  async getHiringKpi(params?: Record<string, string>): Promise<HiringKpi> {
    const { data } = await apiClient.get("/api/analytics/hiring-kpi", { params });
    return data;
  },
  async getCandidates(params?: Record<string, string>): Promise<{ items: Candidate[]; total?: number }> {
    const { data } = await apiClient.get("/api/candidate", { params });
    return data;
  },
  async getCandidateById(id: string): Promise<Candidate> {
    const { data } = await apiClient.get(`/api/candidate/${id}`);
    return data;
  },
  async getCandidateCandidacies(id: string): Promise<{
    items: Array<{
      candidacyId: string;
      vacancyId: string;
      vacancyTitle: string;
      stageName: string;
      stageType: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    const { data } = await apiClient.get(`/api/candidate/${id}/candidacies`);
    return data;
  },
  async getCandidateInterviews(id: string): Promise<{
    items: Array<{
      interviewId: string;
      vacancyTitle: string;
      startedAt: string;
      finishedAt: string;
      status: string;
      score?: number;
      summary?: string;
    }>;
  }> {
    const { data } = await apiClient.get(`/api/interview/candidate/${id}/list`);
    return data;
  },
  async getColdSearches(): Promise<unknown> {
    const { data } = await apiClient.get("/api/cold-search/searches");
    return data;
  },
  async getMessageTemplates(): Promise<unknown> {
    const { data } = await apiClient.get("/api/message-templates/variables");
    return data;
  },
  async getConversationsAwaiting(params?: Record<string, string>): Promise<unknown> {
    const { data } = await apiClient.get("/api/conversations/awaiting", { params });
    return data;
  },
  async getOrgUnits(): Promise<unknown> {
    const { data } = await apiClient.get("/api/org-units");
    return data;
  },
  async getDepartments(): Promise<unknown> {
    const { data } = await apiClient.get("/api/org-units/departments");
    return data;
  },
  async getReferenceDictionary(code: string): Promise<unknown> {
    const { data } = await apiClient.get(`/api/reference-dictionary/${code}`);
    return data;
  },
  async getViewSettings(key: string): Promise<unknown> {
    const { data } = await apiClient.get(`/api/view-settings/${key}`);
    return data;
  },
  async getVacancyById(id: string): Promise<Vacancy> {
    const { data } = await apiClient.get("/api/vacancy", { params: { id } });
    return data;
  },
  async getVacancyInterviews(vacancyId: string, params?: Record<string, string>): Promise<{
    candidacies: Array<{
      candidacyId: string;
      candidateFullName: string;
      candidateFirstName: string;
      candidateLastName: string;
      candidateEmail: string;
      interviewId: string;
      vacancy: { vacancyId: string; title: string; board?: { integrationType: string; externalUrl: string } };
    }>;
  }> {
    const { data } = await apiClient.get(`/api/interview/vacancy/${vacancyId}/list`, { params });
    return data;
  },
  async getVacancyCandidacies(vacancyId: string, params?: Record<string, string>): Promise<{
    items: Array<{
      candidacyId: string;
      candidateId: string;
      candidateFullName: string;
      candidateFirstName: string;
      candidateLastName: string;
      candidateEmail: string;
      stageId: string;
      stageName: string;
      stageType: string;
      status: string;
      updatedAt: string;
    }>;
    total?: number;
  }> {
    const { data } = await apiClient.get(`/api/vacancy/${vacancyId}/candidacies`, { params });
    return data;
  },
  async getVacancyInterviewFacets(vacancyId: string): Promise<unknown> {
    const { data } = await apiClient.get(`/api/interview/vacancy/${vacancyId}/list/facets`);
    return data;
  },
  async getAnalyticsCalculations(payload: unknown): Promise<{ calculationId: string }> {
    const { data } = await apiClient.post("/api/analytics/calculations", payload);
    return data;
  },
  async getAnalyticsResult(calculationId: string): Promise<unknown> {
    const { data } = await apiClient.get(`/api/analytics/calculations/${calculationId}`);
    return data;
  },

  async getCompanyUsers(): Promise<{ items: Array<{ id: string; email: string; name: string; role: string; status: string; lastActiveAt?: string }> }> {
    const { data } = await apiClient.get("/api/company-users");
    return data;
  },
  async inviteUser(payload: { email: string; role: string }): Promise<unknown> {
    const { data } = await apiClient.post("/api/company-users/invite", payload);
    return data;
  },
  async removeUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/company-users/${userId}`);
  },

  async updateAccount(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch("/api/user", payload);
    return data;
  },
  async updateCompany(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch("/api/company", payload);
    return data;
  },
  async getCompany(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("/api/company");
    return data;
  },
  async getNotificationSettings(): Promise<Record<string, boolean>> {
    const { data } = await apiClient.get("/api/notification-settings");
    return data;
  },
  async updateNotificationSettings(payload: Record<string, boolean>): Promise<unknown> {
    const { data } = await apiClient.patch("/api/notification-settings", payload);
    return data;
  },
  async getAppearanceSettings(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("/api/view-settings/interview-appearance");
    return data;
  },
  async updateAppearanceSettings(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch("/api/view-settings/interview-appearance", payload);
    return data;
  },
  async uploadFile(endpoint: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async createVacancy(payload: Record<string, unknown>): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/vacancy", payload);
    return data;
  },
  async updateVacancy(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch("/api/vacancy", { id, ...payload });
    return data;
  },
  async updateVacancyStatus(id: string, status: string): Promise<unknown> {
    const { data } = await apiClient.patch("/api/vacancy/status", { id, status });
    return data;
  },
  async bulkUpdateVacancyStatus(ids: string[], status: string): Promise<unknown> {
    const { data } = await apiClient.post("/api/vacancy/bulk-status", { ids, status });
    return data;
  },
  async bulkDeleteVacancies(ids: string[]): Promise<unknown> {
    const { data } = await apiClient.post("/api/vacancy/bulk-delete", { ids });
    return data;
  },

  async createCandidate(payload: Record<string, unknown>): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/candidate", payload);
    return data;
  },
  async updateCandidate(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/candidate/${id}`, payload);
    return data;
  },
  async addCandidateToVacancy(candidateId: string, vacancyId: string): Promise<unknown> {
    const { data } = await apiClient.post("/api/candidacy", { candidateId, vacancyId });
    return data;
  },
  async moveCandidacyStage(candidacyId: string, stageId: string): Promise<unknown> {
    const { data } = await apiClient.patch("/api/candidacy/stage", { candidacyId, stageId });
    return data;
  },

  async createRole(payload: { name: string; description?: string; permissions: string[] }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/company-roles", payload);
    return data;
  },
  async updateRole(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/company-roles/${id}`, payload);
    return data;
  },
  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/api/company-roles/${id}`);
  },

  async createTemplate(payload: Record<string, unknown>): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/message-templates", payload);
    return data;
  },
  async updateTemplate(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/message-templates/${id}`, payload);
    return data;
  },
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/api/message-templates/${id}`);
  },
  async getMessageTemplateVariables(): Promise<{ variables: string[] }> {
    const { data } = await apiClient.get("/api/message-templates/variables");
    return data;
  },

  async getFunnels(): Promise<{ items: Array<{ id: string; name: string; stages: { id: string; name: string; type: string }[] }> }> {
    const { data } = await apiClient.get("/api/funnel-templates");
    return data;
  },
  async createFunnel(payload: Record<string, unknown>): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/funnel-templates", payload);
    return data;
  },

  async getIntegrations(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("/api/integrations");
    return data;
  },
  async connectIntegration(integrationType: string, payload?: Record<string, unknown>): Promise<unknown> {
    const { data } = await apiClient.post(`/api/integrations/${integrationType}/connect`, payload ?? {});
    return data;
  },
  async disconnectIntegration(integrationType: string): Promise<void> {
    await apiClient.delete(`/api/integrations/${integrationType}`);
  },

  async getConversationMessages(candidacyId: string, params?: Record<string, string>): Promise<{
    items: Array<{ id: string; body: string; direction: "in" | "out"; createdAt: string; channel: string }>;
  }> {
    const { data } = await apiClient.get(`/api/conversations/${candidacyId}/messages`, { params });
    return data;
  },
  async sendMessage(candidacyId: string, body: string): Promise<unknown> {
    const { data } = await apiClient.post(`/api/conversations/${candidacyId}/messages`, { body });
    return data;
  },

  async getNotifications(params?: Record<string, string>): Promise<{
    items: Array<{ id: string; title: string; body: string; createdAt: string; read: boolean; type: string }>;
  }> {
    const { data } = await apiClient.get("/api/notifications", { params });
    return data;
  },
  async markNotificationRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/read`);
  },

  async exportAnalyticsExcel(payload: Record<string, unknown>): Promise<{ url: string }> {
    const { data } = await apiClient.post("/api/analytics/export", payload);
    return data;
  },
  async getExportLog(): Promise<{ items: Array<{ id: string; type: string; createdAt: string; status: string; url?: string }> }> {
    const { data } = await apiClient.get("/api/analytics/export-log");
    return data;
  },
  async getSavedSearches(): Promise<{ items: Array<{ id: string; name: string; query: string; createdAt: string }> }> {
    const { data } = await apiClient.get("/api/saved-searches");
    return data;
  },
  async createSavedSearch(payload: { name: string; query: string }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/saved-searches", payload);
    return data;
  },
  async deleteSavedSearch(id: string): Promise<void> {
    await apiClient.delete(`/api/saved-searches/${id}`);
  },
  async searchCandidatesAI(payload: { query: string }): Promise<{ items: Candidate[]; total?: number }> {
    const { data } = await apiClient.post("/api/candidate/ai-search", payload);
    return data;
  },
  async exportCandidates(params?: Record<string, string>): Promise<{ url: string }> {
    const { data } = await apiClient.post("/api/candidate/export", params);
    return data;
  },
  async exportVacancies(params?: Record<string, string>): Promise<{ url: string }> {
    const { data } = await apiClient.post("/api/vacancy/export", params);
    return data;
  },
  async getCandidateNotes(candidateId: string): Promise<{ items: Array<{ id: string; body: string; author: string; createdAt: string }> }> {
    const { data } = await apiClient.get(`/api/candidate/${candidateId}/notes`);
    return data;
  },
  async addCandidateNote(candidateId: string, body: string): Promise<{ id: string }> {
    const { data } = await apiClient.post(`/api/candidate/${candidateId}/notes`, { body });
    return data;
  },
  async updateCandidateTags(candidateId: string, tags: string[]): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/candidate/${candidateId}/tags`, { tags });
    return data;
  },
  async uploadResume(candidateId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(`/api/candidate/${candidateId}/resume`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async updateUserRole(userId: string, role: string): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/company-users/${userId}/role`, { role });
    return data;
  },
  async resendInvite(userId: string): Promise<unknown> {
    const { data } = await apiClient.post(`/api/company-users/${userId}/resend`);
    return data;
  },
  async deactivateUser(userId: string): Promise<unknown> {
    const { data } = await apiClient.patch(`/api/company-users/${userId}/deactivate`);
    return data;
  },
  async getAnalyticsSourceBreakdown(params?: Record<string, string>): Promise<{
    items: Array<{ name: string; count: number; percent: number }>;
  }> {
    const { data } = await apiClient.get("/api/analytics/source-breakdown", { params });
    return data;
  },
  async getAnalyticsRejectionReasons(params?: Record<string, string>): Promise<{
    items: Array<{ reason: string; count: number; stage: string; who: string }>;
  }> {
    const { data } = await apiClient.get("/api/analytics/rejection-reasons", { params });
    return data;
  },
  async getAnalyticsTeamFunnels(params?: Record<string, string>): Promise<{
    items: Array<{
      recruiterId: string;
      recruiterName: string;
      vacancies: number;
      candidates: number;
      hired: number;
    }>;
  }> {
    const { data } = await apiClient.get("/api/analytics/team-funnels", { params });
    return data;
  },
};
