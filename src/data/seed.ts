import type { Task, User, Priority, Status } from '../types';

export const USERS: User[] = [
  { id: 'u1', name: 'Ananya Krishnan', initials: 'AK', color: '#8b5cf6' },
  { id: 'u2', name: 'Rohan Mehta',     initials: 'RM', color: '#06b6d4' },
  { id: 'u3', name: 'Priya Sharma',    initials: 'PS', color: '#ec4899' },
  { id: 'u4', name: 'Dev Patel',       initials: 'DP', color: '#10b981' },
  { id: 'u5', name: 'Kavya Nair',      initials: 'KN', color: '#f59e0b' },
  { id: 'u6', name: 'Arjun Rao',       initials: 'AR', color: '#ef4444' },
];

// short realistic backlog titles — they repeat with suffixes across 520 tasks
const TITLE_POOL: string[] = [
  'Auth service',
  'Billing page',
  'Dashboard perf',
  'Search',
  'Notifications',
  'CSV export',
  'Dark mode',
  'Onboarding flow',
  'User roles',
  'Admin panel',
  'API cleanup',
  'File uploads',
  'Rate limiting',
  'Audit logs',
  'SSO',
  'Feature flags',
  'CI pipeline',
  'Test coverage',
  'Fix login redirect',
  'Bump dependencies',
  'Migrate users table',
  'Fix prod CORS',
  'Add pagination',
  'Mobile nav',
  'Fix timezone bug',
  'Skeleton loaders',
  'Error boundaries',
  'Fix memory leak',
  'Debounce inputs',
  'Security: rotate keys',
];

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
const STATUSES:   Status[]   = ['todo', 'in-progress', 'in-review', 'done'];

function rInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function dayOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function generateTasks(count = 520): Task[] {
  const tasks: Task[] = [];
  const pool = [...TITLE_POOL].sort(() => Math.random() - 0.5);
  let cycle = 0;

  for (let i = 0; i < count; i++) {
    const poolIdx = i % pool.length;
    if (i > 0 && poolIdx === 0) cycle++;
    // titles repeat with a cycle suffix — reads like carry-over work
    const suffix = cycle === 0 ? '' : ` #${cycle + 1}`;
    const title = pool[poolIdx] + suffix;

    const priority = weighted(PRIORITIES, [7, 18, 45, 30]) as Priority;
    const status   = weighted(STATUSES,   [30, 25, 20, 25]) as Status;

    // first 45 are always overdue so there's always something in the red
    const dueOffset = i < 45 ? rInt(-18, -1) : rInt(-4, 52);
    const dueDate   = dayOffset(dueOffset);

    // ~20% have no start date (for the timeline pill edge case)
    const noStart   = Math.random() < 0.2;
    const startDate = noStart ? undefined : dayOffset(dueOffset - rInt(3, 20));

    tasks.push({
      id:         `task-${i + 1}`,
      title,
      status,
      priority,
      assigneeId: pick(USERS).id,
      startDate,
      dueDate,
      createdAt:  dayOffset(-rInt(1, 60)),
    });
  }

  return tasks;
}

export const INITIAL_TASKS = generateTasks();
