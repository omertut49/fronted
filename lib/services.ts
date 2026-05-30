/** Backend uçlarına tipli erişim katmanı (React Query ile kullanılır). */
import { api } from './api';
import type {
  AuthResponse,
  Game,
  GenerateIdeaResponse,
  IdeaSession,
  Phase,
  Player,
  ProjectMember,
  Report,
  ReportPriority,
  ReportType,
  Task,
  TaskPriority,
  TaskStatus,
  MemberRole,
} from './types';

// ---- Auth ----
export const authApi = {
  register: (body: { email: string; username: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
};

// ---- Games (projeler) ----
export const gamesApi = {
  list: () => api.get<Game[]>('/games').then((r) => r.data),
  get: (id: string) => api.get<Game>(`/games/${id}`).then((r) => r.data),
  create: (body: { title: string; description?: string; genre?: string }) =>
    api.post<Game>('/games', body).then((r) => r.data),
  update: (id: string, body: Partial<Pick<Game, 'title' | 'description' | 'status' | 'genre'>>) =>
    api.patch<Game>(`/games/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/games/${id}`).then((r) => r.data),
};

// ---- Phases ----
export const phasesApi = {
  listWithProgress: (gameId: string) =>
    api.get<Phase[]>('/phases', { params: { gameId } }).then((r) => r.data),
};

// ---- Tasks ----
export const tasksApi = {
  mine: () => api.get<Task[]>('/tasks/my').then((r) => r.data),
  list: (params: { gameId?: string; phaseId?: string; assigneeId?: string }) =>
    api.get<Task[]>('/tasks', { params }).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (body: {
    title: string;
    description?: string;
    gameId: string;
    phaseId: string;
    assigneeId?: string;
    priority?: TaskPriority;
  }) => api.post<Task>('/tasks', body).then((r) => r.data),
  update: (
    id: string,
    body: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      assigneeId: string;
      completionNote: string;
    }>,
  ) => api.patch<Task>(`/tasks/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// ---- Project Members ----
export const membersApi = {
  list: (gameId: string) =>
    api.get<ProjectMember[]>(`/games/${gameId}/members`).then((r) => r.data),
  add: (gameId: string, body: { username: string; role?: MemberRole }) =>
    api.post<ProjectMember>(`/games/${gameId}/members`, body).then((r) => r.data),
  updateRole: (gameId: string, memberId: string, role: MemberRole) =>
    api.patch<ProjectMember>(`/games/${gameId}/members/${memberId}/role`, { role }).then((r) => r.data),
  remove: (gameId: string, memberId: string) =>
    api.delete(`/games/${gameId}/members/${memberId}`).then((r) => r.data),
};

// ---- Reports ----
export const reportsApi = {
  list: (gameId?: string) =>
    api.get<Report[]>('/reports', { params: gameId ? { gameId } : {} }).then((r) => r.data),
  get: (id: string) => api.get<Report>(`/reports/${id}`).then((r) => r.data),
  create: (body: {
    title: string;
    description: string;
    gameId: string;
    type?: ReportType;
    priority?: ReportPriority;
  }) => api.post<Report>('/reports', body).then((r) => r.data),
  resolve: (id: string, resolutionNote: string) =>
    api.post<Report>(`/reports/${id}/resolve`, { resolutionNote }).then((r) => r.data),
  approve: (id: string) => api.post<Report>(`/reports/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.post<Report>(`/reports/${id}/reject`).then((r) => r.data),
  remove: (id: string) => api.delete(`/reports/${id}`).then((r) => r.data),
};

// ---- Ideas (AI) ----
export const ideasApi = {
  generate: (prompt: string) =>
    api.post<GenerateIdeaResponse>('/ideas/generate', { prompt }).then((r) => r.data),
  confirm: (sessionId: string) =>
    api.post<{ gameId: string; message: string }>(`/ideas/sessions/${sessionId}/confirm`).then((r) => r.data),
  getSession: (id: string) => api.get<IdeaSession>(`/ideas/sessions/${id}`).then((r) => r.data),
};

// ---- Players ----
export const playersApi = {
  search: (q: string) => api.get<Player[]>('/players/search', { params: { q } }).then((r) => r.data),
};
