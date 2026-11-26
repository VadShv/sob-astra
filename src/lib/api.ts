import axios, { type AxiosInstance, type AxiosError } from "axios";

export const API_BASE_URL = "/proxy";
export const REAL_API_BASE_URL = "https://api.sobesso.ru";
export const APP_BASE_URL = "https://app.sobesso.ru";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method) && typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
    if (match?.[1]) {
      config.headers["X-CSRF-Token"] = match[1];
    }
  }
  return config;
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
  grade?: string;
  salaryFrom?: number;
  salaryTo?: number;
  description?: string;
  deadline?: string;
  city?: string;
  experience?: string;
  employmentType?: string;
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

export interface CompanyRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
}

export interface ReferenceDictionaryItem {
  id: string;
  name: string;
}

export interface Conversation {
  candidacyId: string;
  candidateFullName: string;
  candidateEmail: string;
  vacancyTitle: string;
  stageName: string;
  lastMessageAt: string;
  lastMessageBody?: string;
  channel?: string;
  awaiting: boolean;
}

export interface ColdSearch {
  id: string;
  query: string;
  createdAt: string;
}

export interface AnalyticsResult {
  calculationId: string;
  status: string;
  data: Record<string, unknown>;
}

export interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  lastActiveAt: string;
  current: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  deadline?: string;
  assignee?: { id: string; name: string };
  vacancyId?: string;
  vacancyTitle?: string;
  candidateId?: string;
  candidateName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  vacancyTitle?: string;
  candidateName?: string;
  startedAt: string;
  duration?: number;
  status: string;
  type?: string;
  link?: string;
  result?: string;
}

export interface Requisition {
  id: string;
  title: string;
  status: string;
  department?: string;
  position?: string;
  plannedHires?: number;
  salaryFrom?: number;
  salaryTo?: number;
  justification?: string;
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidacyId: string;
  candidateId: string;
  candidateFullName: string;
  candidateEmail: string;
  vacancyId: string;
  vacancyTitle: string;
  type: string;
  format: string;
  status: string;
  scheduledAt: string;
  durationMin: number;
  location?: string;
  meetingLink?: string;
  interviewerIds: string[];
  interviewerNames: string[];
  scorecardId?: string;
  scorecardStatus?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scorecard {
  id: string;
  interviewId: string;
  templateId?: string;
  status: string;
  overallRating?: number;
  recommendation?: string;
  sections: Array<{
    id: string;
    name: string;
    rating?: number;
    comment?: string;
    skills?: Array<{ name: string; rating?: number }>;
  }>;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  candidacyId: string;
  candidateId: string;
  candidateFullName: string;
  vacancyId: string;
  vacancyTitle: string;
  status: string;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  startDate?: string;
  deadline?: string;
  conditions?: string;
  benefits?: string;
  sentAt?: string;
  respondedAt?: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  inn?: string;
  ogrn?: string;
  website?: string;
  description?: string;
  region?: string;
  logoUrl?: string;
}

export interface AppearanceSettings {
  primaryColor?: string;
  interviewPageColor?: string;
  interviewPageLogoUrl?: string;
  interviewPageTitle?: string;
  interviewPageDescription?: string;
}

export interface CreateVacancyPayload {
  title: string;
  orgUnitId?: string;
  recruiterId?: string;
  plannedHires: number;
  grade?: string;
  salaryFrom?: number;
  salaryTo?: number;
  description?: string;
  isConfidential?: boolean;
  city?: string;
  experience?: string;
  employmentType?: string;
  deadline?: string;
  funnelTemplateId?: string;
}

export interface CreateCandidatePayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  sourceId?: string;
  position?: string;
  company?: string;
  salary?: number;
  city?: string;
  note?: string;
}

export interface FunnelPayload {
  name: string;
  stages: Array<{ name: string; type: string }>;
}

export interface TemplatePayload {
  name: string;
  subject?: string;
  body: string;
  channel?: string;
  variables?: string[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  type: string;
  deadline?: string;
  assigneeId?: string;
  vacancyId?: string;
  candidateId?: string;
}

export interface UpdateMeetingPayload {
  title?: string;
  startedAt?: string;
  duration?: number;
  location?: string;
  link?: string;
  type?: string;
}

export interface CreateRequisitionPayload {
  title: string;
  department?: string;
  position?: string;
  plannedHires?: number;
  salaryFrom?: number;
  salaryTo?: number;
  justification?: string;
}

export interface ImapConnectionPayload {
  host: string;
  port: number;
  email: string;
  password: string;
  useTls: boolean;
}

export interface ExchangeConnectionPayload {
  email: string;
  password: string;
  server?: string;
}

export interface IntegrationPayload {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

export interface AnalyticsExportPayload {
  from?: string;
  to?: string;
  tzOffset?: string;
  period?: string;
  format?: string;
  recruiterId?: string;
  vacancyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface ReferenceDictionaryPayload {
  code: string;
  name: string;
  values?: Array<{ name: string; code?: string }>;
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
  async acceptInvite(token: string, password: string): Promise<void> {
    await apiClient.post(`/auth/invitations/${token}/accept`, { password });
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
  async getCompanyRoles(): Promise<{ items: CompanyRole[] }> {
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
  async getVacancies(params?: Record<string, string>, signal?: AbortSignal): Promise<{ items: Vacancy[]; total?: number }> {
    const { data } = await apiClient.get("/api/vacancy/all", { params, signal });
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
  async getCandidates(params?: Record<string, string>, signal?: AbortSignal): Promise<{ items: Candidate[]; total?: number }> {
    const { data } = await apiClient.get("/api/candidate", { params, signal });
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
  async getColdSearches(): Promise<{ items: ColdSearch[] }> {
    const { data } = await apiClient.get("/api/cold-search/searches");
    return data;
  },
  async getMessageTemplates(): Promise<{ variables: string[] }> {
    const { data } = await apiClient.get("/api/message-templates/variables");
    return data;
  },
  async getConversationsAwaiting(params?: Record<string, string>, signal?: AbortSignal): Promise<{ items: Conversation[]; total?: number }> {
    const { data } = await apiClient.get("/api/conversations/awaiting", { params, signal });
    return data;
  },
  async getOrgUnits(): Promise<{ items: OrgUnit[] }> {
    const { data } = await apiClient.get("/api/org-units");
    return data;
  },
  async getDepartments(): Promise<{ items: Array<{ id: string; name: string }> }> {
    const { data } = await apiClient.get("/api/org-units/departments");
    return data;
  },
  async getReferenceDictionary(code: string): Promise<{ items: ReferenceDictionaryItem[] }> {
    const { data } = await apiClient.get(`/api/reference-dictionary/${code}`);
    return data;
  },
  async getPermissions(): Promise<{ items: Array<{ code: string; name: string; description?: string }> }> {
    const { data } = await apiClient.get("/api/permissions");
    return data;
  },
  async getNotificationTypes(): Promise<{ items: Array<{ code: string; name: string; description: string }> }> {
    const { data } = await apiClient.get("/api/notification-types");
    return data;
  },
  async getViewSettings(key: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`/api/view-settings/${key}`);
    return data;
  },
  async updateViewSettings(key: string, payload: Record<string, unknown>): Promise<void> {
    await apiClient.put(`/api/view-settings/${key}`, payload);
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
  async getVacancyInterviewFacets(vacancyId: string): Promise<{ total: number; statuses: Array<{ value: string; label: string; count: number }> }> {
    const { data } = await apiClient.get(`/api/interview/vacancy/${vacancyId}/list/facets`);
    return data;
  },
  async getAnalyticsCalculations(payload: AnalyticsExportPayload): Promise<{ calculationId: string }> {
    const { data } = await apiClient.post("/api/analytics/calculations", payload);
    return data;
  },
  async getAnalyticsResult(calculationId: string): Promise<AnalyticsResult> {
    const { data } = await apiClient.get(`/api/analytics/calculations/${calculationId}`);
    return data;
  },

  async getCompanyUsers(): Promise<{ items: Array<{ id: string; email: string; name: string; role: string; status: string; lastActiveAt?: string }> }> {
    const { data } = await apiClient.get("/api/company-users");
    return data;
  },
  async inviteUser(payload: { email: string; role: string }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/company-users/invite", payload);
    return data;
  },
  async removeUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/company-users/${userId}`);
  },

  async updateAccount(payload: Partial<CreateCandidatePayload> & { currentPassword?: string; newPassword?: string; locale?: string }): Promise<UserDetails> {
    const { data } = await apiClient.patch("/api/user", payload);
    return data;
  },
  async updateCompany(payload: Partial<Company>): Promise<Company> {
    const { data } = await apiClient.patch("/api/company", payload);
    return data;
  },
  async getCompany(): Promise<Company> {
    const { data } = await apiClient.get("/api/company");
    return data;
  },
  async getNotificationSettings(): Promise<Record<string, boolean>> {
    const { data } = await apiClient.get("/api/notification-settings");
    return data;
  },
  async updateNotificationSettings(payload: Record<string, boolean>): Promise<Record<string, boolean>> {
    const { data } = await apiClient.patch("/api/notification-settings", payload);
    return data;
  },
  async getAppearanceSettings(): Promise<AppearanceSettings> {
    const { data } = await apiClient.get("/api/view-settings/interview-appearance");
    return data;
  },
  async updateAppearanceSettings(payload: Partial<AppearanceSettings>): Promise<AppearanceSettings> {
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

  async createVacancy(payload: CreateVacancyPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/vacancy", payload);
    return data;
  },
  async updateVacancy(id: string, payload: Partial<CreateVacancyPayload>): Promise<Vacancy> {
    const { data } = await apiClient.patch("/api/vacancy", { id, ...payload });
    return data;
  },
  async updateVacancyStatus(id: string, status: string): Promise<Vacancy> {
    const { data } = await apiClient.patch("/api/vacancy/status", { id, status });
    return data;
  },
  async bulkUpdateVacancyStatus(ids: string[], status: string): Promise<{ updated: number }> {
    const { data } = await apiClient.post("/api/vacancy/bulk-status", { ids, status });
    return data;
  },
  async bulkDeleteVacancies(ids: string[]): Promise<{ deleted: number }> {
    const { data } = await apiClient.post("/api/vacancy/bulk-delete", { ids });
    return data;
  },

  async createCandidate(payload: CreateCandidatePayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/candidate", payload);
    return data;
  },
  async updateCandidate(id: string, payload: Partial<CreateCandidatePayload>): Promise<Candidate> {
    const { data } = await apiClient.patch(`/api/candidate/${id}`, payload);
    return data;
  },
  async addCandidateToVacancy(candidateId: string, vacancyId: string): Promise<{ candidacyId: string }> {
    const { data } = await apiClient.post("/api/candidacy", { candidateId, vacancyId });
    return data;
  },
  async moveCandidacyStage(candidacyId: string, stageId: string): Promise<{ candidacyId: string; stageId: string }> {
    const { data } = await apiClient.patch("/api/candidacy/stage", { candidacyId, stageId });
    return data;
  },

  async createRole(payload: { name: string; description?: string; permissions: string[] }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/company-roles", payload);
    return data;
  },
  async updateRole(id: string, payload: RoleUpdatePayload): Promise<{ id: string }> {
    const { data } = await apiClient.put(`/api/company-roles/${id}`, payload);
    return data;
  },
  async deleteRole(id: string): Promise<void> {
    await apiClient.post(`/api/company-roles/${id}/archive`);
  },

  async createTemplate(payload: TemplatePayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/message-templates", payload);
    return data;
  },
  async updateTemplate(id: string, payload: Partial<TemplatePayload>): Promise<{ id: string }> {
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
  async createFunnel(payload: FunnelPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/funnel-templates", payload);
    return data;
  },

  async getIntegrations(): Promise<{
    items: Array<{
      type: string;
      name: string;
      connected: boolean;
      config?: Record<string, unknown>;
    }>;
  }> {
    const { data } = await apiClient.get("/api/integrations");
    return data;
  },
  async connectIntegration(integrationType: string, payload?: IntegrationPayload): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/api/integrations/${integrationType}/connect`, payload ?? {});
    return data;
  },
  async disconnectIntegration(integrationType: string): Promise<void> {
    await apiClient.delete(`/api/integrations/${integrationType}`);
  },
  async testIntegration(integrationType: string, payload?: IntegrationPayload): Promise<{ success: boolean; message?: string }> {
    const { data } = await apiClient.post(`/api/integrations/${integrationType}/test`, payload ?? {});
    return data;
  },
  async updateFunnel(id: string, payload: Partial<FunnelPayload>): Promise<{ id: string }> {
    const { data } = await apiClient.patch(`/api/funnel-templates/${id}`, payload);
    return data;
  },
  async deleteFunnel(id: string): Promise<void> {
    await apiClient.delete(`/api/funnel-templates/${id}`);
  },

  async getConversationMessages(candidacyId: string, params?: Record<string, string>): Promise<{
    items: Array<{ id: string; body: string; direction: "in" | "out"; createdAt: string; channel: string }>;
  }> {
    const { data } = await apiClient.get(`/api/conversations/${candidacyId}/messages`, { params });
    return data;
  },
  async sendMessage(candidacyId: string, body: string): Promise<{ id: string; createdAt: string }> {
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
    await apiClient.post(`/api/notifications/${id}/read`);
  },

  async exportAnalyticsExcel(payload: AnalyticsExportPayload): Promise<{ url: string }> {
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
  async updateCandidateTags(candidateId: string, tags: string[]): Promise<{ tags: Array<{ id: string; name: string }> }> {
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
  async updateUserRole(userId: string, role: string): Promise<{ id: string; role: string }> {
    const { data } = await apiClient.patch(`/api/company-users/${userId}/role`, { role });
    return data;
  },
  async resendInvite(userId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/api/company-users/${userId}/resend`);
    return data;
  },
  async deactivateUser(userId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/api/company-users/${userId}/deactivate`);
    return data;
  },
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post("/api/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async get2FAStatus(): Promise<{ enabled: boolean; qrUrl?: string }> {
    const { data } = await apiClient.get("/api/user/2fa");
    return data;
  },
  async enable2FA(code: string): Promise<{ enabled: boolean }> {
    const { data } = await apiClient.post("/api/user/2fa/enable", { code });
    return data;
  },
  async disable2FA(): Promise<void> {
    await apiClient.delete("/api/user/2fa");
  },
  async getSessions(): Promise<{ items: SessionInfo[] }> {
    const { data } = await apiClient.get("/api/user/sessions");
    return data;
  },
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/api/user/sessions/${sessionId}`);
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

  async getTasks(params?: Record<string, string>): Promise<{ items: Task[]; total?: number }> {
    const { data } = await apiClient.get("/api/tasks", { params });
    return data;
  },
  async createTask(payload: CreateTaskPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/tasks", payload);
    return data;
  },
  async getTaskCount(): Promise<{ count: number }> {
    const { data } = await apiClient.get("/api/tasks/my-count");
    return data;
  },
  async getTaskTypes(): Promise<{ items: Array<{ id: string; name: string }> }> {
    const { data } = await apiClient.get("/api/tasks/types");
    return data;
  },
  async getTaskById(id: string): Promise<Task> {
    const { data } = await apiClient.get(`/api/tasks/${id}`);
    return data;
  },
  async updateTaskDeadline(id: string, deadline: string): Promise<void> {
    await apiClient.patch(`/api/tasks/${id}/deadline`, { deadline });
  },
  async getTaskHistory(id: string): Promise<{ items: Array<{ id: string; action: string; createdAt: string; author: string }> }> {
    const { data } = await apiClient.get(`/api/tasks/${id}/history`);
    return data;
  },
  async updateTaskStatus(id: string, status: string): Promise<void> {
    await apiClient.patch(`/api/tasks/${id}/status`, { status });
  },

  async getMeetings(params?: Record<string, string>): Promise<{ items: Meeting[]; total?: number }> {
    const { data } = await apiClient.get("/api/meetings", { params });
    return data;
  },
  async getMeetingById(id: string): Promise<Meeting> {
    const { data } = await apiClient.get(`/api/meetings/${id}`);
    return data;
  },
  async updateMeeting(id: string, payload: UpdateMeetingPayload): Promise<void> {
    await apiClient.patch(`/api/meetings/${id}`, payload);
  },
  async cancelMeeting(id: string): Promise<void> {
    await apiClient.post(`/api/meetings/${id}/cancel`);
  },
  async setMeetingResult(id: string, payload: { result: string; rating?: number }): Promise<void> {
    await apiClient.post(`/api/meetings/${id}/result`, payload);
  },
  async deleteMeeting(id: string): Promise<void> {
    await apiClient.delete(`/api/meetings/${id}`);
  },

  async getRequisitions(params?: Record<string, string>): Promise<{ items: Requisition[]; total?: number }> {
    const { data } = await apiClient.get("/api/requisitions", { params });
    return data;
  },
  async createRequisition(payload: CreateRequisitionPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/requisitions", payload);
    return data;
  },
  async getRequisitionSummary(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    const { data } = await apiClient.get("/api/requisitions/summary");
    return data;
  },
  async getRequisitionById(id: string): Promise<Requisition> {
    const { data } = await apiClient.get(`/api/requisitions/${id}`);
    return data;
  },
  async updateRequisition(id: string, payload: Partial<CreateRequisitionPayload>): Promise<void> {
    await apiClient.patch(`/api/requisitions/${id}`, payload);
  },
  async getRequisitionApprovals(id: string): Promise<{ items: Array<{ id: string; approver: string; status: string; createdAt: string }> }> {
    const { data } = await apiClient.get(`/api/requisitions/${id}/approvals`);
    return data;
  },
  async cancelRequisition(id: string): Promise<void> {
    await apiClient.post(`/api/requisitions/${id}/cancel`);
  },
  async submitRequisition(id: string): Promise<void> {
    await apiClient.post(`/api/requisitions/${id}/submit`);
  },
  async withdrawRequisition(id: string): Promise<void> {
    await apiClient.post(`/api/requisitions/${id}/withdraw`);
  },

  async getTeams(): Promise<{ items: Array<{ id: string; name: string; parentId?: string; members?: Array<{ id: string; name: string }> }> }> {
    const { data } = await apiClient.get("/api/org-units/teams");
    return data;
  },
  async getDepartmentsPick(): Promise<{ items: Array<{ id: string; name: string }> }> {
    const { data } = await apiClient.get("/api/org-units/departments/pick");
    return data;
  },

  async getReferenceDictionaryList(): Promise<{ items: Array<{ id: string; name: string; code: string }> }> {
    const { data } = await apiClient.get("/api/reference-dictionary");
    return data;
  },
  async createReferenceDictionary(payload: ReferenceDictionaryPayload): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/reference-dictionary", payload);
    return data;
  },
  async updateReferenceDictionary(id: string, payload: Partial<ReferenceDictionaryPayload>): Promise<void> {
    await apiClient.patch(`/api/reference-dictionary/${id}`, payload);
  },
  async archiveReferenceDictionary(id: string): Promise<void> {
    await apiClient.post(`/api/reference-dictionary/${id}/archive`);
  },

  async getExternalApiTokens(): Promise<{ items: Array<{ id: string; name: string; createdAt: string; lastUsedAt?: string }> }> {
    const { data } = await apiClient.get("/api/settings/external-api/tokens");
    return data;
  },
  async createExternalApiToken(payload: { name: string }): Promise<{ id: string; token: string }> {
    const { data } = await apiClient.post("/api/settings/external-api/tokens", payload);
    return data;
  },
  async revokeExternalApiToken(id: string): Promise<void> {
    await apiClient.post(`/api/settings/external-api/tokens/${id}/revoke`);
  },
  async getExternalApiHooks(): Promise<{ items: Array<{ id: string; url: string; event: string; createdAt: string }> }> {
    const { data } = await apiClient.get("/api/settings/external-api/hooks");
    return data;
  },
  async deleteExternalApiHook(id: string): Promise<void> {
    await apiClient.delete(`/api/settings/external-api/hooks/${id}`);
  },

  async getMailboxConnection(): Promise<{ connected: boolean; type?: string; email?: string; paused?: boolean }> {
    const { data } = await apiClient.get("/api/mailbox/connection");
    return data;
  },
  async connectImap(payload: ImapConnectionPayload): Promise<void> {
    await apiClient.post("/api/mailbox/imap/connect", payload);
  },
  async connectExchange(payload: ExchangeConnectionPayload): Promise<void> {
    await apiClient.post("/api/mailbox/exchange/connect", payload);
  },
  async disconnectMailbox(): Promise<void> {
    await apiClient.delete("/api/mailbox/connection");
  },
  async pauseMailbox(): Promise<void> {
    await apiClient.post("/api/mailbox/connection/pause");
  },
  async resumeMailbox(): Promise<void> {
    await apiClient.post("/api/mailbox/connection/resume");
  },

  async getAuditLog(params?: { page?: string; pageSize?: string; entity?: string; userId?: string }): Promise<{
    items: Array<{
      id: string;
      action: string;
      entity: string;
      entityId: string;
      entityName?: string;
      userId: string;
      userName: string;
      details?: Record<string, unknown>;
      createdAt: string;
      ip?: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { data } = await apiClient.get("/api/audit-log", { params });
    return data;
  },

  async getInterviewById(id: string): Promise<Interview> {
    const { data } = await apiClient.get(`/api/interview/${id}`);
    return data;
  },
  async createInterview(payload: {
    candidacyId: string;
    type: string;
    format: string;
    scheduledAt: string;
    durationMin: number;
    location?: string;
    meetingLink?: string;
    interviewerIds: string[];
  }): Promise<Interview> {
    const { data } = await apiClient.post("/api/interview", payload);
    return data;
  },
  async updateInterview(id: string, payload: Partial<{
    scheduledAt: string;
    durationMin: number;
    location: string;
    meetingLink: string;
    interviewerIds: string[];
    status: string;
  }>): Promise<Interview> {
    const { data } = await apiClient.put(`/api/interview/${id}`, payload);
    return data;
  },
  async cancelInterview(id: string): Promise<void> {
    await apiClient.post(`/api/interview/${id}/cancel`);
  },
  async getInterviewTypes(): Promise<Array<{ value: string; label: string }>> {
    const { data } = await apiClient.get("/api/interview/types");
    return data;
  },
  async getInterviewers(vacancyId?: string): Promise<Array<{ id: string; name: string }>> {
    const { data } = await apiClient.get("/api/interview/interviewers", {
      params: vacancyId ? { vacancyId } : undefined,
    });
    return data;
  },

  async getScorecard(interviewId: string): Promise<Scorecard> {
    const { data } = await apiClient.get(`/api/interview/${interviewId}/scorecard`);
    return data;
  },
  async updateScorecard(interviewId: string, payload: Partial<Scorecard>): Promise<Scorecard> {
    const { data } = await apiClient.put(`/api/interview/${interviewId}/scorecard`, payload);
    return data;
  },
  async getScorecardTemplates(): Promise<Array<{
    id: string;
    name: string;
    sections: Array<{ id: string; name: string; skills?: string[] }>;
  }>> {
    const { data } = await apiClient.get("/api/scorecard-templates");
    return data;
  },

  async getOffers(vacancyId: string, params?: Record<string, string>): Promise<{
    items: Offer[];
    total: number;
  }> {
    const { data } = await apiClient.get(`/api/vacancy/${vacancyId}/offers`, { params });
    return data;
  },
  async getOfferById(id: string): Promise<Offer> {
    const { data } = await apiClient.get(`/api/offer/${id}`);
    return data;
  },
  async createOffer(payload: {
    candidacyId: string;
    salaryFrom?: number;
    salaryTo?: number;
    currency?: string;
    startDate?: string;
    deadline?: string;
    conditions?: string;
    benefits?: string;
  }): Promise<Offer> {
    const { data } = await apiClient.post("/api/offer", payload);
    return data;
  },
  async updateOffer(id: string, payload: Partial<Offer>): Promise<Offer> {
    const { data } = await apiClient.put(`/api/offer/${id}`, payload);
    return data;
  },
  async sendOffer(id: string): Promise<void> {
    await apiClient.post(`/api/offer/${id}/send`);
  },
  async acceptOffer(id: string): Promise<void> {
    await apiClient.post(`/api/offer/${id}/accept`);
  },
  async declineOffer(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/api/offer/${id}/decline`, reason ? { reason } : undefined);
  },
  async withdrawOffer(id: string): Promise<void> {
    await apiClient.post(`/api/offer/${id}/withdraw`);
  },

  async getCustomFields(entity?: string): Promise<{
    items: Array<{
      id: string;
      name: string;
      type: string;
      entity: string;
      options?: string[];
      required: boolean;
      createdAt: string;
    }>;
  }> {
    const { data } = await apiClient.get("/api/custom-fields", {
      params: entity ? { entity } : undefined,
    });
    return data;
  },
  async createCustomField(payload: {
    name: string;
    type: string;
    entity: string;
    options?: string[];
    required?: boolean;
  }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/custom-fields", payload);
    return data;
  },
  async deleteCustomField(id: string): Promise<void> {
    await apiClient.delete(`/api/custom-fields/${id}`);
  },

  async getWebhookLogs(params?: { page?: string; pageSize?: string }): Promise<{
    items: Array<{
      id: string;
      hookId: string;
      hookUrl: string;
      event: string;
      status: number;
      requestBody?: string;
      responseBody?: string;
      durationMs: number;
      createdAt: string;
    }>;
    total: number;
  }> {
    const { data } = await apiClient.get("/api/settings/external-api/hooks/logs", { params });
    return data;
  },

  async getActivityFeed(params?: { page?: string; pageSize?: string; vacancyId?: string }): Promise<{
    items: Array<{
      id: string;
      type: string;
      description: string;
      userId: string;
      userName: string;
      entityType: string;
      entityId: string;
      entityName?: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const { data } = await apiClient.get("/api/activity-feed", { params });
    return data;
  },

  async getCandidateOffers(candidateId: string): Promise<{
    items: Offer[];
  }> {
    const { data } = await apiClient.get(`/api/candidate/${candidateId}/offers`);
    return data;
  },

  async getCandidateDocuments(candidateId: string): Promise<{
    items: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
      uploadedBy?: string;
      url?: string;
    }>;
  }> {
    const { data } = await apiClient.get(`/api/candidate/${candidateId}/documents`);
    return data;
  },
  async uploadCandidateDocument(candidateId: string, file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(`/api/candidate/${candidateId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async deleteCandidateDocument(candidateId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/candidate/${candidateId}/documents/${documentId}`);
  },

  async compareCandidates(candidateIds: string[]): Promise<{
    candidates: Array<{
      candidateId: string;
      fullName: string;
      email: string;
      phone: string;
      position?: string;
      company?: string;
      salary?: number;
      skills?: string[];
      experience?: string;
      education?: string;
      rating?: number;
      tags?: string[];
      lastActivity?: string;
    }>;
  }> {
    const { data } = await apiClient.post("/api/candidate/compare", { candidateIds });
    return data;
  },

  async getTags(): Promise<{
    items: Array<{
      id: string;
      name: string;
      color?: string;
      category?: string;
      count: number;
    }>;
  }> {
    const { data } = await apiClient.get("/api/tags");
    return data;
  },
  async createTag(payload: { name: string; color?: string; category?: string }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/tags", payload);
    return data;
  },
  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/api/tags/${id}`);
  },

  async bulkMoveCandidacies(candidacyIds: string[], stageId: string): Promise<void> {
    await apiClient.post("/api/candidacy/bulk-move", { candidacyIds, stageId });
  },
  async bulkRejectCandidacies(candidacyIds: string[], reason?: string): Promise<void> {
    await apiClient.post("/api/candidacy/bulk-reject", { candidacyIds, reason });
  },
  async bulkTagCandidates(candidateIds: string[], tagIds: string[]): Promise<void> {
    await apiClient.post("/api/candidate/bulk-tag", { candidateIds, tagIds });
  },
  async findDuplicateCandidates(candidateId: string): Promise<{
    items: Array<{ candidateId: string; fullName: string; email: string; matchScore: number }>;
  }> {
    const { data } = await apiClient.get(`/api/candidate/${candidateId}/duplicates`);
    return data;
  },

  async publishVacancy(vacancyId: string, channels: string[]): Promise<void> {
    await apiClient.post(`/api/vacancy/${vacancyId}/publish`, { channels });
  },
  async unpublishVacancy(vacancyId: string, channel: string): Promise<void> {
    await apiClient.post(`/api/vacancy/${vacancyId}/unpublish`, { channel });
  },
  async getPublicationStatus(vacancyId: string): Promise<{
    items: Array<{
      channel: string;
      channelName: string;
      published: boolean;
      externalId?: string;
      externalUrl?: string;
      publishedAt?: string;
      error?: string;
    }>;
  }> {
    const { data } = await apiClient.get(`/api/vacancy/${vacancyId}/publications`);
    return data;
  },

  async createScorecardTemplate(payload: {
    name: string;
    sections: Array<{ name: string; skills?: string[] }>;
  }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/scorecard-templates", payload);
    return data;
  },
  async deleteScorecardTemplate(id: string): Promise<void> {
    await apiClient.delete(`/api/scorecard-templates/${id}`);
  },

  async getOfferTemplates(): Promise<{
    items: Array<{
      id: string;
      name: string;
      subject?: string;
      body: string;
      variables?: string[];
      createdAt: string;
    }>;
  }> {
    const { data } = await apiClient.get("/api/offer-templates");
    return data;
  },
  async createOfferTemplate(payload: {
    name: string;
    subject?: string;
    body: string;
    variables?: string[];
  }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/offer-templates", payload);
    return data;
  },
  async deleteOfferTemplate(id: string): Promise<void> {
    await apiClient.delete(`/api/offer-templates/${id}`);
  },

  async getVacancyAnalytics(vacancyId: string): Promise<{
    conversion: Array<{ stage: string; count: number; conversionRate: number }>;
    timeInStage: Array<{ stage: string; avgDays: number }>;
    sources: Array<{ source: string; count: number }>;
    totalCandidates: number;
    hiredCount: number;
    avgTimeToHire: number | null;
  }> {
    const { data } = await apiClient.get(`/api/vacancy/${vacancyId}/analytics`);
    return data;
  },

  async getEmailTemplates(): Promise<{
    items: Array<{
      id: string;
      name: string;
      subject: string;
      body: string;
      variables: string[];
      createdAt: string;
    }>;
  }> {
    const { data } = await apiClient.get("/api/email-templates");
    return data;
  },
  async renderEmailTemplate(templateId: string, variables: Record<string, string>): Promise<{
    subject: string;
    body: string;
  }> {
    const { data } = await apiClient.post(`/api/email-templates/${templateId}/render`, { variables });
    return data;
  },

  async getConversationDetails(candidacyId: string): Promise<{
    candidacyId: string;
    candidateId: string;
    candidateFullName: string;
    candidateEmail: string;
    vacancyTitle: string;
    channel: string;
    messages: Array<{
      id: string;
      body: string;
      direction: "in" | "out";
      channel: string;
      createdAt: string;
      attachments?: Array<{ id: string; name: string; url: string }>;
    }>;
  }> {
    const { data } = await apiClient.get(`/api/conversations/${candidacyId}`);
    return data;
  },
  async sendAttachment(candidacyId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.post(`/api/conversations/${candidacyId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async connectGoogleCalendar(payload: { code: string }): Promise<void> {
    await apiClient.post("/api/calendar/google/connect", payload);
  },
  async connectOutlookCalendar(payload: { code: string }): Promise<void> {
    await apiClient.post("/api/calendar/outlook/connect", payload);
  },
  async disconnectCalendar(type: string): Promise<void> {
    await apiClient.delete(`/api/calendar/${type}/disconnect`);
  },
  async getCalendarSyncStatus(): Promise<{
    google: { connected: boolean; email?: string };
    outlook: { connected: boolean; email?: string };
  }> {
    const { data } = await apiClient.get("/api/calendar/sync-status");
    return data;
  },

  async getSubscription(): Promise<{
    plan: string;
    status: string;
    seats: number;
    usedSeats: number;
    currentPeriodEnd: string;
    amount: number;
    currency: string;
  }> {
    const { data } = await apiClient.get("/api/billing/subscription");
    return data;
  },
  async getInvoices(): Promise<{
    items: Array<{
      id: string;
      number: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      pdfUrl?: string;
    }>;
  }> {
    const { data } = await apiClient.get("/api/billing/invoices");
    return data;
  },

  async getPipelines(): Promise<{
    items: Array<{
      id: string;
      name: string;
      description?: string;
      candidateCount: number;
      createdAt: string;
    }>;
  }> {
    const { data } = await apiClient.get("/api/pipelines");
    return data;
  },
  async createPipeline(payload: { name: string; description?: string }): Promise<{ id: string }> {
    const { data } = await apiClient.post("/api/pipelines", payload);
    return data;
  },

  async exportCandidateData(candidateId: string): Promise<{ url: string }> {
    const { data } = await apiClient.post(`/api/candidate/${candidateId}/export-data`);
    return data;
  },
  async deleteCandidateData(candidateId: string): Promise<void> {
    await apiClient.delete(`/api/candidate/${candidateId}/data`);
  },

  async getWebhookEventTypes(): Promise<Array<{ value: string; label: string; description?: string }>> {
    const { data } = await apiClient.get("/api/settings/external-api/hooks/event-types");
    return data;
  },

  async getReferralProgram(): Promise<{
    enabled: boolean;
    bonusAmount?: number;
    currency?: string;
    conditions?: string;
    referralsCount: number;
  }> {
    const { data } = await apiClient.get("/api/referral-program");
    return data;
  },
  async updateReferralProgram(payload: { enabled: boolean; bonusAmount?: number; conditions?: string }): Promise<void> {
    await apiClient.put("/api/referral-program", payload);
  },

  async getPublicVacancies(params?: Record<string, string>): Promise<{
    items: Array<{
      id: string;
      title: string;
      description?: string;
      city?: string;
      salaryFrom?: number;
      salaryTo?: number;
      employmentType?: string;
      experience?: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const { data } = await apiClient.get("/api/public/vacancies", { params });
    return data;
  },
  async getPublicVacancyById(id: string): Promise<{
    id: string;
    title: string;
    description?: string;
    city?: string;
    salaryFrom?: number;
    salaryTo?: number;
    employmentType?: string;
    experience?: string;
    company: { name: string; description?: string; logoUrl?: string };
    createdAt: string;
  }> {
    const { data } = await apiClient.get(`/api/public/vacancy/${id}`);
    return data;
  },
  async submitApplication(vacancyId: string, payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    resumeUrl?: string;
  }): Promise<{ candidacyId: string }> {
    const { data } = await apiClient.post(`/api/public/vacancy/${vacancyId}/apply`, payload);
    return data;
  },
};
