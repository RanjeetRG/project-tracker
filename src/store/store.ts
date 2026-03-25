// zustand — selector subscriptions keep re-renders per-component

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, FilterState, SortState, ViewMode, Status } from '../types';
import { INITIAL_TASKS } from '../data/seed';

interface AppStore {
  tasks:      Task[];
  view:       ViewMode;
  filters:    FilterState;
  sort:       SortState;

  setView:       (v: ViewMode) => void;
  setFilters:    (f: Partial<FilterState>) => void;
  clearFilters:  () => void;
  setSort:       (field: SortState['field']) => void;
  moveTask:      (taskId: string, newStatus: Status) => void;
  setTaskStatus: (taskId: string, status: Status) => void;
  resetTasks:    () => void;
}

const BLANK_FILTERS: FilterState = {
  status:      [],
  priority:    [],
  assignees:   [],
  dueDateFrom: '',
  dueDateTo:   '',
};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      tasks:   INITIAL_TASKS,
      view:    'kanban',
      filters: BLANK_FILTERS,
      sort:    { field: 'dueDate', dir: 'asc' },

      setView: (view) => set({ view }),

      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial } })),

      clearFilters: () => set({ filters: BLANK_FILTERS }),

      // clicking the same column header toggles direction, clicking a new one
      // resets to ascending
      setSort: (field) =>
        set((s) => ({
          sort: {
            field,
            dir: s.sort.field === field && s.sort.dir === 'asc' ? 'desc' : 'asc',
          },
        })),

      moveTask: (taskId, newStatus) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        })),

      setTaskStatus: (taskId, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          ),
        })),

      // Resets task data back to the generated seed and clears persisted storage.
      resetTasks: () => set({ tasks: INITIAL_TASKS }),
    }),
    {
      name: 'taskboard-v1',
      // Only persist tasks and view — filters and sort always reset to
      // defaults on load (filters live in the URL, sort has a sensible default).
      partialize: (s) => ({ tasks: s.tasks, view: s.view }),
    },
  ),
);

// filter + sort are plain functions — memoised in the component with useMemo

export function getFilteredTasks(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((t) => {
    if (filters.status.length    && !filters.status.includes(t.status))         return false;
    if (filters.priority.length  && !filters.priority.includes(t.priority))     return false;
    if (filters.assignees.length && !filters.assignees.includes(t.assigneeId))  return false;
    if (filters.dueDateFrom      && t.dueDate < filters.dueDateFrom)            return false;
    if (filters.dueDateTo        && t.dueDate > filters.dueDateTo)              return false;
    return true;
  });
}

const P_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function getSortedTasks(tasks: Task[], sort: SortState): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'priority':
        cmp = P_RANK[a.priority] - P_RANK[b.priority];
        break;
      case 'dueDate':
        cmp = a.dueDate.localeCompare(b.dueDate);
        break;
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}
