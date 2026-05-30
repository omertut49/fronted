/** Türkçe etiketler ve enum eşlemeleri. */
import type {
  GameGenre,
  GameStatus,
  PhaseType,
  ReportPriority,
  ReportStatus,
  ReportType,
  TaskPriority,
  TaskStatus,
  MemberRole,
} from './types';

export const genreLabels: Record<GameGenre, string> = {
  action: 'Aksiyon',
  rpg: 'RPG',
  puzzle: 'Bulmaca',
  strategy: 'Strateji',
  simulation: 'Simülasyon',
  sports: 'Spor',
  other: 'Diğer',
};

export const gameStatusLabels: Record<GameStatus, string> = {
  planning: 'Planlama',
  in_progress: 'Geliştirme',
  testing: 'Test',
  released: 'Yayınlandı',
  cancelled: 'İptal',
};

export const phaseTypeLabels: Record<PhaseType, string> = {
  concept_design: 'Konsept & Tasarım',
  prototype: 'Prototip',
  art_visual: 'Sanat & Görsel',
  production: 'Prodüksiyon',
  test_balance: 'Test & Dengeleme',
  polish: 'Cila',
  release: 'Yayın',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'Yapılacak',
  in_progress: 'Devam Ediyor',
  done: 'Tamamlandı',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const reportTypeLabels: Record<ReportType, string> = {
  bug: 'Hata',
  suggestion: 'Öneri',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  open: 'Açık',
  pending_approval: 'Onay Bekliyor',
  resolved: 'Çözüldü',
  closed: 'Kapandı',
};

export const reportPriorityLabels: Record<ReportPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const roleLabels: Record<MemberRole, string> = {
  admin: 'Yönetici',
  member: 'Üye',
};

/** İsimden baş harf(ler) üretir (avatar fallback). */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
