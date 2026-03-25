import { useStore } from '../store/store';
import { CollabAvatar } from './PresenceAvatar';
import type { CollabUser, ViewMode } from '../types';

interface HeaderProps {
  collabUsers: CollabUser[];
  activeCount: number;
}

const VIEWS: { id: ViewMode; label: string; glyph: string }[] = [
  { id: 'kanban',   label: 'Board',    glyph: '⊞' },
  { id: 'list',     label: 'List',     glyph: '≡' },
  { id: 'timeline', label: 'Timeline', glyph: '⊟' },
];

export function Header({ collabUsers, activeCount }: HeaderProps) {
  const { view, setView } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/90 backdrop-blur-sm shrink-0 shadow-sm">
      <div className="px-3 md:px-5 h-14 flex items-center justify-between gap-3 md:gap-4">

        {/* Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="font-display font-black text-white text-sm leading-none select-none">P</span>
          </div>
          <span className="font-display font-semibold text-text-primary text-sm tracking-tight">Plane</span>
          <span className="text-border-strong select-none">·</span>
          <span className="text-text-muted text-sm font-body">Engineering Sprint</span>
        </div>

        {/* Who's online */}
        <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-bg-raised border border-border-subtle">
            <div className="flex -space-x-2">
              {collabUsers.map((u) => (
                <CollabAvatar key={u.id} user={u} faded={!u.taskId} />
              ))}
            </div>
            <span className="text-text-muted text-xs font-body">
              {activeCount} {activeCount === 1 ? 'person' : 'people'} viewing
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
          </div>
        </div>

        {/* View switcher */}
        <nav className="flex items-center gap-0.5 bg-bg-raised border border-border-subtle rounded-lg p-0.5 shrink-0">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-current={view === v.id ? 'page' : undefined}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium
                transition-all duration-150 select-none
                ${view === v.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-border-default'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }
              `}
            >
              <span className="text-sm leading-none" aria-hidden>{v.glyph}</span>
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
