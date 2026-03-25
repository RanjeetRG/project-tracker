// Syncs filters + active view to the URL so links are shareable.
// popstate restores state on back/forward.

import { useEffect } from 'react';
import { useStore } from '../store/store';
import type { FilterState, ViewMode, Status, Priority } from '../types';

const VIEWS: ViewMode[] = ['kanban', 'list', 'timeline'];

function join(arr: string[])          { return arr.join(','); }
function split(s: string | null)      { return s ? s.split(',').filter(Boolean) : []; }

function applyParams(
  params: URLSearchParams,
  setView: (v: ViewMode) => void,
  setFilters: (f: Partial<FilterState>) => void,
) {
  const v = params.get('view') as ViewMode;
  if (VIEWS.includes(v)) setView(v);

  setFilters({
    status:      split(params.get('status'))   as Status[],
    priority:    split(params.get('priority')) as Priority[],
    assignees:   split(params.get('assignees')),
    dueDateFrom: params.get('from') ?? '',
    dueDateTo:   params.get('to')   ?? '',
  });
}

export function useURLFilters() {
  const { filters, view, setFilters, setView, clearFilters } = useStore();

  // read from URL once on mount
  useEffect(() => {
    applyParams(new URLSearchParams(window.location.search), setView, setFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep URL in sync with back/forward
  useEffect(() => {
    const handler = () =>
      applyParams(new URLSearchParams(window.location.search), setView, setFilters);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [setView, setFilters]);

  // push store state into URL
  useEffect(() => {
    const p = new URLSearchParams();
    p.set('view', view);
    if (filters.status.length)    p.set('status',    join(filters.status));
    if (filters.priority.length)  p.set('priority',  join(filters.priority));
    if (filters.assignees.length) p.set('assignees', join(filters.assignees));
    if (filters.dueDateFrom)      p.set('from',      filters.dueDateFrom);
    if (filters.dueDateTo)        p.set('to',        filters.dueDateTo);

    const next = `${window.location.pathname}?${p.toString()}`;
    if (next !== window.location.href) {
      window.history.replaceState(null, '', next);
    }
  }, [filters, view]);

  const hasActiveFilters =
    filters.status.length > 0    ||
    filters.priority.length > 0  ||
    filters.assignees.length > 0 ||
    !!filters.dueDateFrom         ||
    !!filters.dueDateTo;

  return { hasActiveFilters, clearFilters };
}
