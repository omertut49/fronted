// Backend entity'lerine birebir tipler (backend/src altındaki entity dosyalarından teyit edildi).

export type MemberRole = 'admin' | 'member';

export type GameStatus = 'planning' | 'in_progress' | 'testing' | 'released' | 'cancelled';
export type GameGenre =
  | 'action'
  | 'rpg'
  | 'puzzle'
  | 'strategy'
  | 'simulation'
  | 'sports'
  | 'other';

export type PhaseType =
  | 'concept_design'
  | 'prototype'
  | 'art_visual'
  | 'production'
  | 'test_balance'
  | 'polish'
  | 'release';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type ReportType = 'bug' | 'suggestion';
export type ReportStatus = 'open' | 'pending_approval' | 'resolved' | 'closed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Player {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  player: Player;
}

export interface Progress {
  total: number;
  done: number;
  percentage: number;
}

export interface Phase {
  id: string;
  name: string;
  order: number;
  type: PhaseType;
  gameId: string;
  createdAt?: string;
  /** /phases?gameId= ucunda gelir */
  progress?: Progress;
}

export interface ProjectMember {
  id: string;
  gameId: string;
  playerId: string;
  player?: Player;
  role: MemberRole;
  joinedAt?: string;
}

export interface Game {
  id: string;
  title: string;
  description?: string | null;
  status: GameStatus;
  genre: GameGenre;
  coverUrl?: string | null;
  ownerId?: string | null;
  owner?: Player | null;
  phases?: Phase[];
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  /** GET /games ve GET /games/:id yanıtına backend'de eklendi */
  myRole?: MemberRole | null;
  progress?: Progress;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completionNote?: string | null;
  phaseId: string;
  phase?: Phase;
  gameId: string;
  game?: Game;
  assigneeId?: string | null;
  assignee?: Player | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  priority: ReportPriority;
  resolutionNote?: string | null;
  playerId?: string | null;
  player?: Player | null;
  resolvedById?: string | null;
  resolvedBy?: Player | null;
  gameId: string;
  createdAt: string;
  updatedAt: string;
}

// ---- AI Ideas ----
export interface AiTask {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

export interface AiPhase {
  type: PhaseType;
  tasks: AiTask[];
}

export interface IdeaPlan {
  projectName: string;
  projectDescription: string;
  genre?: GameGenre;
  phases: AiPhase[];
}

export interface GenerateIdeaResponse {
  sessionId: string;
  plan: IdeaPlan;
}

export interface IdeaSession {
  id: string;
  prompt: string;
  aiPlan?: string | null;
  isConfirmed: boolean;
  createdById: string;
  createdAt: string;
  plan?: IdeaPlan | null;
}
