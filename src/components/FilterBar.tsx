import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/store';
import { USERS } from '../data/seed';
import { PRIORITY_LABELS, STATUS_LABELS, ALL_STATUSES, ALL_PRIORITIES } from '../utils/constants';
import type { Status, Priority } from '../types';

interface MultiSelectProps<T extends string> {
  label:    string;
  options:  T[];
  selected: T[];
  labels:   Record<T, string>;
  onChange: (v: T[]) => void;
}

function MultiSelect<T extends string>({ label, options, selected, labels, onChange }: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function toggle(val: T) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }

  const isActive = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body border transition-all
          ${isActive
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
            : 'border-border-subtle bg-white text-text-secondary hover:text-text-primary hover:border-border-default'
          }
        `}
      >
        {label}
        {isActive && (
          <span className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-1.5 py-px rounded-full leading-none">
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-border-default rounded-lg shadow-lg min-w-44 py-1 animate-slide-in">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-body hover:bg-bg-raised transition-colors"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  checked ? 'bg-indigo-600 border-indigo-600' : 'border-border-strong bg-white'
                }`}>
                  {checked && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12">
                      <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={checked ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                  {labels[opt]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FilterBarProps {
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function FilterBar({ hasActiveFilters, onClear }: FilterBarProps) {
  const { filters, setFilters } = useStore();

  const userLabels = Object.fromEntries(USERS.map((u) => [u.id, u.name])) as Record<string, string>;

  return (
    <div className="px-3 md:px-5 py-2 border-b border-border-subtle bg-white flex items-center gap-2 flex-wrap shrink-0">
      <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest mr-1 select-none">
        Filter
      </span>

      <MultiSelect
        label="Status"
        options={ALL_STATUSES}
        selected={filters.status}
        labels={STATUS_LABELS as Record<Status, string>}
        onChange={(v) => setFilters({ status: v })}
      />
      <MultiSelect
        label="Priority"
        options={ALL_PRIORITIES}
        selected={filters.priority}
        labels={PRIORITY_LABELS as Record<Priority, string>}
        onChange={(v) => setFilters({ priority: v })}
      />
      <MultiSelect
        label="Assignee"
        options={USERS.map((u) => u.id)}
        selected={filters.assignees}
        labels={userLabels}
        onChange={(v) => setFilters({ assignees: v })}
      />

      <div className="hidden md:flex items-center gap-1.5">
        <span className="text-text-muted text-[10px] font-mono uppercase tracking-wide select-none">Due</span>
        <input
          type="date"
          value={filters.dueDateFrom}
          onChange={(e) => setFilters({ dueDateFrom: e.target.value })}
          title="Due from"
          className="px-2.5 py-1.5 rounded-md border border-border-subtle bg-white text-text-secondary
                     text-xs font-mono focus:outline-none focus:border-indigo-400 focus:text-text-primary
                     transition-colors cursor-pointer"
        />
        <span className="text-text-muted text-xs select-none">→</span>
        <input
          type="date"
          value={filters.dueDateTo}
          onChange={(e) => setFilters({ dueDateTo: e.target.value })}
          title="Due to"
          className="px-2.5 py-1.5 rounded-md border border-border-subtle bg-white text-text-secondary
                     text-xs font-mono focus:outline-none focus:border-indigo-400 focus:text-text-primary
                     transition-colors cursor-pointer"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body
                     text-text-muted hover:text-red-500 border border-transparent
                     hover:border-red-200 hover:bg-red-50 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear all
        </button>
      )}
    </div>
  );
}
