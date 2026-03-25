// virtual-scrolled sortable table (no library)

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import type { Task, CollabUser, SortField, Status } from '../types';
import { useStore } from '../store/store';
import { USERS } from '../data/seed';
import { PRIORITY_BG, PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS, ALL_STATUSES } from '../utils/constants';
import { formatDueLabel } from '../utils/dates';
import { PresencePill } from '../components/PresenceAvatar';

const ROW_H  = 52;
const BUFFER = 5;

interface ListViewProps {
  tasks:           Task[];
  presenceMap:     Map<string, CollabUser[]>;
  onClearFilters?: () => void;
}

function StatusCell({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const { setTaskStatus } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function pick(status: Status) {
    setTaskStatus(task.id, status);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-body
                   border border-transparent hover:border-border-subtle hover:bg-bg-raised transition-all"
        style={{ color: STATUS_COLORS[task.status] }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[task.status] }} />
        {STATUS_LABELS[task.status]}
        <svg
          className={`w-3 h-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-border-default
                        rounded-lg shadow-lg py-1 min-w-[148px] animate-slide-in">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => pick(s)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-body
                         hover:bg-bg-raised transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[s] }} />
              <span className={s === task.status ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                {STATUS_LABELS[s]}
              </span>
              {s === task.status && <span className="ml-auto text-indigo-500 text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortHeader({
  field, label, className, activeField, dir, onSort,
}: {
  field: SortField; label: string; className: string;
  activeField: SortField; dir: 'asc' | 'desc'; onSort: (f: SortField) => void;
}) {
  const active = field === activeField;
  return (
    <button
      onClick={() => onSort(field)}
      className={`group flex items-center text-xs font-mono uppercase tracking-wider transition-colors ${className} ${
        active ? 'text-indigo-600' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
      <span className={`ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
        {active && dir === 'desc' ? '↓' : '↑'}
      </span>
    </button>
  );
}

export function ListView({ tasks, presenceMap, onClearFilters }: ListViewProps) {
  const { sort, setSort } = useStore();
  const containerRef      = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH,     setViewH]     = useState(600);

  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [tasks]);

  // measure real container height so windowing math is accurate from the start
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const measured = containerRef.current.clientHeight;
    if (measured > 0) setViewH(measured);

    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setViewH(h);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER);
  const endIdx   = Math.min(tasks.length - 1, Math.ceil((scrollTop + viewH) / ROW_H) + BUFFER);
  const visible  = tasks.slice(startIdx, endIdx + 1);
  const totalH   = tasks.length * ROW_H;
  const topPad   = startIdx * ROW_H;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 select-none">
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border-default
                        flex items-center justify-center mb-4 bg-white">
          <span className="text-2xl text-text-muted">≡</span>
        </div>
        <h3 className="text-text-primary font-display font-semibold text-lg mb-1">
          No tasks match
        </h3>
        <p className="text-text-muted text-sm font-body mb-5">
          Try adjusting your filters to see results.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default
                       bg-white text-text-secondary text-sm font-body
                       hover:border-indigo-400 hover:text-indigo-600 transition-all"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      <div className="flex items-center px-5 py-2.5 border-b border-border-subtle bg-bg-raised/80 shrink-0">
        <SortHeader field="title"    label="Title"    className="flex-1 pr-3" activeField={sort.field} dir={sort.dir} onSort={setSort} />
        <SortHeader field="priority" label="Priority" className="w-28"        activeField={sort.field} dir={sort.dir} onSort={setSort} />
        <SortHeader field="dueDate"  label="Due"      className="w-28"        activeField={sort.field} dir={sort.dir} onSort={setSort} />
        <div className="w-36 text-xs font-mono uppercase tracking-wider text-text-muted">Assignee</div>
        <div className="w-36 text-xs font-mono uppercase tracking-wider text-text-muted">Status</div>
        <div className="w-14 text-xs font-mono uppercase tracking-wider text-text-muted">Live</div>
      </div>

      <div className="px-5 py-1 border-b border-border-subtle shrink-0 bg-white">
        <span className="text-text-muted text-[11px] font-mono">{tasks.length} tasks</span>
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto bg-white"
        style={{ willChange: 'scroll-position' }}
      >
        <div style={{ height: totalH, position: 'relative' }}>
          <div style={{ position: 'absolute', top: topPad, left: 0, right: 0 }}>
            {visible.map((task) => {
              const assignee = USERS.find((u) => u.id === task.assigneeId)!;
              const { label, overdue, warn } = formatDueLabel(task.dueDate);
              const presence = presenceMap.get(task.id) ?? [];
              const dotColor =
                task.priority === 'critical' ? '#dc2626' :
                task.priority === 'high'     ? '#ea580c' :
                task.priority === 'medium'   ? '#2563eb' : '#6b7280';

              return (
                <div
                  key={task.id}
                  className="flex items-center px-5 border-b border-border-subtle
                             hover:bg-bg-raised/60 transition-colors"
                  style={{ height: ROW_H }}
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0 pr-3">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                    <span className="text-text-primary text-sm font-body truncate">{task.title}</span>
                  </div>

                  <div className="w-28 shrink-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${PRIORITY_BG[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  <div className="w-28 shrink-0">
                    <span className={`text-xs font-mono ${
                      overdue ? 'text-red-500' : warn ? 'text-orange-500' : 'text-text-muted'
                    }`}>
                      {label}
                    </span>
                  </div>

                  <div className="w-36 flex items-center gap-2 shrink-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center
                                 text-[9px] font-mono font-semibold shrink-0"
                      style={{ backgroundColor: assignee.color + '20', color: assignee.color }}
                    >
                      {assignee.initials}
                    </div>
                    <span className="text-text-secondary text-xs font-body truncate">
                      {assignee.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="w-36 shrink-0">
                    <StatusCell task={task} />
                  </div>

                  <div className="w-14 shrink-0">
                    {presence.length > 0 && <PresencePill users={presence} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
