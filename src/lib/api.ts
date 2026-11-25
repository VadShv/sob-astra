import axios, { type AxiosInstance } from "axios";

export const API_BASE_URL = "/proxy";
export const REAL_API_BASE_URL = "https://api.sobesso.ru";
export const APP_BASE_URL = "https://app.sobesso.ru";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

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
};
