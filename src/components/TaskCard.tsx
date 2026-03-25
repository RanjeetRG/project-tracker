import type { Task, CollabUser } from '../types';
import { USERS } from '../data/seed';
import { PRIORITY_BG, PRIORITY_LABELS, PRIORITY_COLORS } from '../utils/constants';
import { formatDueLabel } from '../utils/dates';
import { PresencePill } from './PresenceAvatar';

interface Props {
  task:           Task;
  presence:       CollabUser[];
  onPointerDown?: (e: React.PointerEvent<HTMLElement>, taskId: string) => void;
}

export function TaskCard({ task, presence, onPointerDown }: Props) {
  const assignee = USERS.find((u) => u.id === task.assigneeId)!;
  const { label, overdue, warn } = formatDueLabel(task.dueDate);

  return (
    <div
      data-task-card={task.id}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, task.id) : undefined}
      className="
        relative bg-white border border-border-subtle rounded-lg p-3
        cursor-grab active:cursor-grabbing select-none touch-none
        hover:border-border-default hover:shadow-sm
        transition-all duration-150
      "
    >
      {/* Left accent strip colour-coded by priority */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-text-primary text-sm font-body leading-snug line-clamp-2 flex-1">
            {task.title}
          </p>
          {presence.length > 0 && (
            <div className="shrink-0 animate-fade-in">
              <PresencePill users={presence} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${PRIORITY_BG[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${
              overdue ? 'text-red-500' : warn ? 'text-orange-500' : 'text-text-muted'
            }`}>
              {label}
            </span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-semibold shrink-0"
              style={{ backgroundColor: assignee.color + '20', color: assignee.color }}
              title={assignee.name}
            >
              {assignee.initials}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
