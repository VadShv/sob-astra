export const qk = {
  auth: {
    me: () => ["auth-me"] as const,
    user: () => ["user"] as const,
  },
  vacancies: {
    active: (status?: string, page?: number, pageSize?: number, sortBy?: string, sortOrder?: string) =>
      ["vacancies-active", status, page, pageSize, sortBy, sortOrder] as const,
    sidebar: () => ["sidebar-vacancies"] as const,
    facets: (status?: string) => ["vacancy-facets", status] as const,
    detail: (id: string) => ["vacancy", id] as const,
    candidacies: (id: string) => ["vacancy-candidacies", id] as const,
    forFilter: () => ["vacancies-for-filter"] as const,
    forAdd: () => ["vacancies-for-add"] as const,
    all: () => ["vacancies-active"] as const,
  },
  candidates: {
    list: (q?: string, sources?: string[], tags?: string[], sort?: string, page?: number, pageSize?: number) =>
      ["candidates", q, sources, tags, sort, page, pageSize] as const,
    all: () => ["candidates"] as const,
    detail: (id: string) => ["candidate", id] as const,
    candidacies: (id: string) => ["candidate-candidacies", id] as const,
    interviews: (id: string) => ["candidate-interviews", id] as const,
    notes: (id: string) => ["candidate-notes", id] as const,
    tags: () => ["candidate-tags"] as const,
    sources: () => ["candidate-sources"] as const,
  },
  conversations: {
    awaiting: (subTab?: string, onlyMine?: boolean, channels?: string[], page?: number, pageSize?: number) =>
      ["conversations-awaiting", subTab, onlyMine, channels, page, pageSize] as const,
    all: () => ["conversations-awaiting"] as const,
    messages: (candidacyId: string) => ["conversation-messages", candidacyId] as const,
  },
  analytics: {
    kpi: (period?: string, recruiterId?: string, vacancyId?: string) =>
      ["hiring-kpi", period, recruiterId, vacancyId] as const,
    all: () => ["hiring-kpi"] as const,
    sourceBreakdown: (period?: string, recruiterId?: string, vacancyId?: string) =>
      ["analytics-source-breakdown", period, recruiterId, vacancyId] as const,
    rejectionReasons: (period?: string, recruiterId?: string, vacancyId?: string) =>
      ["analytics-rejection-reasons", period, recruiterId, vacancyId] as const,
    teamFunnels: (period?: string, recruiterId?: string, vacancyId?: string) =>
      ["analytics-team-funnels", period, recruiterId, vacancyId] as const,
    exportLog: () => ["export-log"] as const,
  },
  notifications: {
    unread: () => ["unread-count"] as const,
    awaiting: () => ["awaiting-count"] as const,
    settings: () => ["notification-settings"] as const,
    types: () => ["notification-types"] as const,
    list: () => ["notifications"] as const,
  },
  settings: {
    company: () => ["company"] as const,
    companyRoles: () => ["company-roles"] as const,
    companyUsers: () => ["company-users"] as const,
    permissions: () => ["permissions"] as const,
    funnels: () => ["funnel-templates"] as const,
    messageTemplates: () => ["message-templates"] as const,
    messageTemplateVariables: () => ["message-template-variables"] as const,
    integrations: () => ["integrations"] as const,
    appearance: () => ["appearance-settings"] as const,
    twoFaStatus: () => ["2fa-status"] as const,
    sessions: () => ["user-sessions"] as const,
  },
  reference: {
    dictionary: (code: string) => [`reference-${code}`] as const,
    grades: () => ["reference-grades"] as const,
    regions: () => ["reference-regions"] as const,
    channels: () => ["reference-channels"] as const,
    orgUnits: () => ["org-units"] as const,
  },
  search: {
    cold: () => ["cold-searches"] as const,
    saved: () => ["saved-searches"] as const,
  },
  tasks: {
    list: (params?: Record<string, string>) => ["tasks", params] as const,
    all: () => ["tasks"] as const,
    count: () => ["tasks-count"] as const,
    types: () => ["tasks-types"] as const,
    detail: (id: string) => ["task", id] as const,
    history: (id: string) => ["task-history", id] as const,
  },
  meetings: {
    list: (params?: Record<string, string>) => ["meetings", params] as const,
    all: () => ["meetings"] as const,
    detail: (id: string) => ["meeting", id] as const,
  },
  requisitions: {
    list: (params?: Record<string, string>) => ["requisitions", params] as const,
    all: () => ["requisitions"] as const,
    summary: () => ["requisitions-summary"] as const,
    detail: (id: string) => ["requisition", id] as const,
    approvals: (id: string) => ["requisition-approvals", id] as const,
  },
  teams: {
    list: () => ["teams"] as const,
  },
  dictionaries: {
    list: () => ["reference-dictionaries"] as const,
  },
  externalApi: {
    tokens: () => ["external-api-tokens"] as const,
    hooks: () => ["external-api-hooks"] as const,
  },
  mailbox: {
    connection: () => ["mailbox-connection"] as const,
  },
  audit: {
    list: (params?: Record<string, string>) => ["audit-log", params] as const,
  },
  interviews: {
    list: (vacancyId: string, params?: Record<string, string>) => ["interviews", vacancyId, params] as const,
    detail: (id: string) => ["interview", id] as const,
    types: () => ["interview-types"] as const,
    interviewers: (vacancyId?: string) => ["interviewers", vacancyId] as const,
    scorecard: (interviewId: string) => ["scorecard", interviewId] as const,
    scorecardTemplates: () => ["scorecard-templates"] as const,
  },
  offers: {
    list: (vacancyId: string, params?: Record<string, string>) => ["offers", vacancyId, params] as const,
    detail: (id: string) => ["offer", id] as const,
  },
  customFields: {
    list: (entity?: string) => ["custom-fields", entity] as const,
  },
  webhookLogs: {
    list: (params?: Record<string, string>) => ["webhook-logs", params] as const,
  },
  activityFeed: {
    list: (params?: Record<string, string>) => ["activity-feed", params] as const,
  },
  documents: {
    list: (candidateId: string) => ["candidate-documents", candidateId] as const,
  },
  tags: {
    list: () => ["tags"] as const,
  },
  compare: {
    candidates: (ids: string[]) => ["compare-candidates", ids] as const,
  },
} as const;
