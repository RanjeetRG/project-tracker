import type { Priority, Status } from '../types';

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#2563eb',
  low:      '#6b7280',
};

export const PRIORITY_BG: Record<Priority, string> = {
  critical: 'bg-red-50 text-red-600 border-red-200',
  high:     'bg-orange-50 text-orange-600 border-orange-200',
  medium:   'bg-blue-50 text-blue-600 border-blue-200',
  low:      'bg-gray-100 text-gray-500 border-gray-200',
};

export const STATUS_LABELS: Record<Status, string> = {
  'todo':        'To Do',
  'in-progress': 'In Progress',
  'in-review':   'In Review',
  'done':        'Done',
};

export const STATUS_COLORS: Record<Status, string> = {
  'todo':        '#94a3b8',
  'in-progress': '#f59e0b',
  'in-review':   '#8b5cf6',
  'done':        '#10b981',
};

export const ALL_STATUSES:   Status[]   = ['todo', 'in-progress', 'in-review', 'done'];
export const ALL_PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
