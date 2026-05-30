/**
 * Durum/öncelik rozet renkleri — yumuşak dolgu + aynı ailenin koyu tonu (asla düz siyah).
 * Açık/koyu moda göre iki set.
 */
import type { Scheme } from '../constants/theme';
import type { ReportPriority, ReportStatus, TaskPriority, TaskStatus } from './types';

export interface Swatch {
  bg: string;
  fg: string;
}

type Family = 'neutral' | 'blue' | 'green' | 'amber' | 'red';

const light: Record<Family, Swatch> = {
  neutral: { bg: '#EDE8DF', fg: '#7C7568' },
  blue: { bg: '#E3ECF5', fg: '#3D6B96' },
  green: { bg: '#E2F0E4', fg: '#4A7C52' },
  amber: { bg: '#F7ECD9', fg: '#9A7430' },
  red: { bg: '#F8E2DC', fg: '#B0452F' },
};

const dark: Record<Family, Swatch> = {
  neutral: { bg: 'rgba(255,255,255,0.08)', fg: '#A39B8E' },
  blue: { bg: 'rgba(96,150,200,0.18)', fg: '#8FB6DB' },
  green: { bg: 'rgba(90,160,105,0.18)', fg: '#8FC79A' },
  amber: { bg: 'rgba(200,160,80,0.18)', fg: '#D6B274' },
  red: { bg: 'rgba(220,110,85,0.20)', fg: '#E89B86' },
};

function fam(scheme: Scheme, family: Family): Swatch {
  return (scheme === 'dark' ? dark : light)[family];
}

const taskStatusFamily: Record<TaskStatus, Family> = {
  todo: 'neutral',
  in_progress: 'blue',
  done: 'green',
};

const reportStatusFamily: Record<ReportStatus, Family> = {
  open: 'amber',
  pending_approval: 'blue',
  resolved: 'green',
  closed: 'neutral',
};

const priorityFamily: Record<ReportPriority, Family> = {
  low: 'neutral',
  medium: 'amber',
  high: 'red',
  critical: 'red',
};

export const taskStatusSwatch = (scheme: Scheme, s: TaskStatus) => fam(scheme, taskStatusFamily[s]);
export const reportStatusSwatch = (scheme: Scheme, s: ReportStatus) =>
  fam(scheme, reportStatusFamily[s]);
export const prioritySwatch = (scheme: Scheme, p: TaskPriority | ReportPriority) =>
  fam(scheme, priorityFamily[p]);
