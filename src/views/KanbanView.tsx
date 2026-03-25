
import { useRef, useCallback } from 'react';
import type { Task, Status, CollabUser } from '../types';
import { useStore } from '../store/store';
import { TaskCard } from '../components/TaskCard';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

const COLUMNS: Status[] = ['todo', 'in-progress', 'in-review', 'done'];

const COL_ICON: Record<Status, string> = {
  'todo':        '○',
  'in-progress': '◑',
  'in-review':   '◕',
  'done':        '●',
};

const COL_BG: Record<Status, string> = {
  'todo':        'bg-slate-50',
  'in-progress': 'bg-amber-50/60',
  'in-review':   'bg-violet-50/60',
  'done':        'bg-emerald-50/60',
};

const VALID_COLS = new Set<string>(COLUMNS);

interface DragState {
  taskId:         string;
  sourceStatus:   Status;
  cardHeight:     number;
  originX:        number;   // card rect.left at drag start — snap-back target
  originY:        number;   // card rect.top  at drag start — snap-back target
  offsetX:        number;   // pointer offset inside the card (x)
  offsetY:        number;   // pointer offset inside the card (y)
  clone:          HTMLElement;
  placeholder:    HTMLElement;
  currentOverCol: Status | null;
}

interface KanbanViewProps {
  tasks:       Task[];
  presenceMap: Map<string, CollabUser[]>;
}

export function KanbanView({ tasks, presenceMap }: KanbanViewProps) {
  const { moveTask } = useStore();

  // Stable ref so pointermove closure never captures a stale tasks array.
  const tasksRef    = useRef<Task[]>(tasks);
  tasksRef.current  = tasks;

  const dragRef = useRef<DragState | null>(null);

  const tasksByStatus = (s: Status) => tasks.filter((t) => t.status === s);



  function clearHighlights() {
    document.querySelectorAll('[data-col-status]').forEach((el) => {
      const div = el as HTMLElement;
      div.style.borderColor     = '';
      div.style.backgroundColor = '';
    });
  }



  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, taskId: string) => {
      // Mouse: only respond to the primary (left) button.
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const rect = el.getBoundingClientRect();
      const cs   = window.getComputedStyle(el);

      // clone the card as a floating ghost
      const clone = el.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position:      'fixed',
        width:         rect.width  + 'px',
        height:        rect.height + 'px',
        left:          rect.left   + 'px',
        top:           rect.top    + 'px',
        opacity:       '0.82',
        boxShadow:     '0 12px 32px rgba(0,0,0,0.22)',
        pointerEvents: 'none',
        zIndex:        '9999',
        transition:    'none',
        borderRadius:  cs.borderRadius,
        margin:        '0',
        transform:     'rotate(-1.5deg) scale(1.02)',
        userSelect:    'none',
      });
      document.body.appendChild(clone);

      // placeholder keeps the column from reflowing
      const ph = document.createElement('div');
      Object.assign(ph.style, {
        height:       rect.height + 'px',
        borderRadius: cs.borderRadius,
        border:       '2px dashed #94a3b8',
        background:   'rgba(148,163,184,0.07)',
        flexShrink:   '0',
      });
      ph.setAttribute('data-is-placeholder', 'true');
      el.parentNode!.insertBefore(ph, el);
      el.style.opacity = '0';

      document.body.style.cursor = 'grabbing';

      // hide "no tasks" empties while dragging
      document.querySelectorAll('[data-empty-state]').forEach((e) => {
        (e as HTMLElement).style.display = 'none';
      });

      const task = tasksRef.current.find((t) => t.id === taskId)!;
      dragRef.current = {
        taskId,
        sourceStatus:   task.status,
        cardHeight:     rect.height,
        originX:        rect.left,
        originY:        rect.top,
        offsetX:        e.clientX - rect.left,
        offsetY:        e.clientY - rect.top,
        clone,
        placeholder:    ph,
        currentOverCol: null,
      };

      // update source column count (no re-render during drag)
      const srcBadge = document.querySelector(
        `[data-col-count="${task.status}"]`,
      ) as HTMLElement | null;
      if (srcBadge) srcBadge.textContent = String(Number(srcBadge.textContent) - 1);


      function detach() {
        el.removeEventListener('pointermove',   onMove);
        el.removeEventListener('pointerup',     onUp);
        el.removeEventListener('pointercancel', onCancel);
        document.body.style.cursor = '';
      }


      function onMove(ev: PointerEvent) {
        const drag = dragRef.current;
        if (!drag) return;

        // Follow the pointer.
        clone.style.left = (ev.clientX - drag.offsetX) + 'px';
        clone.style.top  = (ev.clientY - drag.offsetY) + 'px';

        // hide clone so elementFromPoint sees what's underneath
        clone.style.visibility = 'hidden';
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        clone.style.visibility = '';

        // walk up to the nearest column
        let ancestor: Element | null = target;
        while (ancestor && !ancestor.hasAttribute('data-col-status')) {
          ancestor = ancestor.parentElement;
        }
        const hovered = (ancestor?.getAttribute('data-col-status') ?? null) as Status | null;

        if (hovered && VALID_COLS.has(hovered)) {
          // Update highlight only when the hovered column changes.
          if (hovered !== drag.currentOverCol) {
            clearHighlights();
            (ancestor as HTMLElement).style.borderColor     = '#818cf8'; // indigo-400
            (ancestor as HTMLElement).style.backgroundColor = 'rgba(238,242,255,0.5)';
            drag.currentOverCol = hovered;
          }

          // Reposition placeholder every tick so it tracks the pointer
          // up/down within the same column (mid-point hit-test).
          const container = document.querySelector(`[data-cards-container="${hovered}"]`);
          if (container) {
            const cards = Array.from(
              container.querySelectorAll('[data-task-card]'),
            ).filter(
              (c) =>
                !(c as HTMLElement).hasAttribute('data-is-placeholder') &&
                (c as HTMLElement).dataset.taskCard !== drag.taskId,
            ) as HTMLElement[];

            let insertBefore: HTMLElement | null = null;
            for (const card of cards) {
              const r = card.getBoundingClientRect();
              if (ev.clientY < r.top + r.height / 2) {
                insertBefore = card;
                break;
              }
            }
            if (insertBefore) {
              container.insertBefore(ph, insertBefore);
            } else {
              container.appendChild(ph);
            }
          }
        } else if (!hovered && drag.currentOverCol !== null) {
          clearHighlights();
          drag.currentOverCol = null;
        }

        // auto-scroll near edges
        if (ancestor instanceof HTMLElement) {
          const ZONE  = 56;  // px from edge that activates scroll
          const SPEED = 10;  // px per pointermove tick

          const scrollRect     = ancestor.getBoundingClientRect();
          const distFromTop    = ev.clientY - scrollRect.top;
          const distFromBottom = scrollRect.bottom - ev.clientY;

          if (distFromTop > 0 && distFromTop < ZONE) {
            ancestor.scrollTop -= SPEED * (1 - distFromTop / ZONE);
          } else if (distFromBottom > 0 && distFromBottom < ZONE) {
            ancestor.scrollTop += SPEED * (1 - distFromBottom / ZONE);
          }
        }
      }


      function onUp() {
        const drag = dragRef.current;
        if (!drag) return;
        detach();
        clearHighlights();

        if (drag.currentOverCol && drag.currentOverCol !== drag.sourceStatus) {
          // Valid cross-column drop — commit immediately.
          clone.remove();
          ph.remove();
          el.style.opacity = '1';

          // Restore empty states and increment target column badge.
          document.querySelectorAll('[data-empty-state]').forEach((e) => {
            (e as HTMLElement).style.display = '';
          });
          const tgtBadge = document.querySelector(
            `[data-col-count="${drag.currentOverCol}"]`,
          ) as HTMLElement | null;
          if (tgtBadge) tgtBadge.textContent = String(Number(tgtBadge.textContent) + 1);

          // auto-expand filter so the moved card stays visible
          const currentFilters = useStore.getState().filters;
          if (
            currentFilters.status.length > 0 &&
            !currentFilters.status.includes(drag.currentOverCol)
          ) {
            useStore.getState().setFilters({
              status: [...currentFilters.status, drag.currentOverCol],
            });
          }

          moveTask(drag.taskId, drag.currentOverCol);
          dragRef.current = null;
        } else {
          if (drag.currentOverCol === drag.sourceStatus) {
            // Dropped on the same column — shake the ghost, then snap back.
            clone.style.transition = 'transform 0.07s ease-in-out';
            clone.style.transform  = 'rotate(2.5deg) scale(1.03)';
            setTimeout(() => {
              clone.style.transform = 'rotate(-2.5deg) scale(1.03)';
              setTimeout(() => {
                clone.style.transform = 'rotate(0deg) scale(1.02)';
                snapBack(drag);
              }, 75);
            }, 75);
          } else {
            // Released outside any column — snap back immediately.
            snapBack(drag);
          }
        }
      }


      function onCancel() {
        const drag = dragRef.current;
        if (!drag) return;
        detach();
        clearHighlights();
        snapBack(drag);
      }


      function snapBack(drag: DragState) {
        clearHighlights();
        clone.style.transition  = 'left 0.25s ease-out, top 0.25s ease-out, opacity 0.2s ease-out, transform 0.2s ease-out';
        clone.style.left        = drag.originX + 'px';
        clone.style.top         = drag.originY + 'px';
        clone.style.opacity     = '0';
        clone.style.transform   = 'rotate(0deg) scale(0.95)';

        clone.addEventListener(
          'transitionend',
          () => {
            clone.remove();
            ph.remove();
            el.style.opacity = '1';
            dragRef.current  = null;


            document.querySelectorAll('[data-empty-state]').forEach((e) => {
              (e as HTMLElement).style.display = '';
            });
            const srcBadge = document.querySelector(
              `[data-col-count="${drag.sourceStatus}"]`,
            ) as HTMLElement | null;
            if (srcBadge) srcBadge.textContent = String(Number(srcBadge.textContent) + 1);
          },
          { once: true },
        );
      }

      el.addEventListener('pointermove',   onMove);
      el.addEventListener('pointerup',     onUp);
      el.addEventListener('pointercancel', onCancel);
    },
    [moveTask],
  );



  return (
    <div className="flex gap-4 h-full min-h-0 overflow-x-auto px-3 md:px-5 pb-5 pt-4">
      {COLUMNS.map((status) => {
        const colTasks = tasksByStatus(status);

        return (
          <div key={status} className="flex flex-col min-w-[272px] w-[272px] shrink-0 min-h-0">

            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-0.5 shrink-0">
              <span className="text-sm leading-none" style={{ color: STATUS_COLORS[status] }}>
                {COL_ICON[status]}
              </span>
              <h3 className="text-text-secondary text-sm font-body font-semibold flex-1">
                {STATUS_LABELS[status]}
              </h3>
              <span
                data-col-count={status}
                className="text-[11px] font-mono text-text-muted bg-white
                           border border-border-subtle px-1.5 py-0.5 rounded-md shadow-sm"
              >
                {colTasks.length}
              </span>
            </div>

            {/*
              Card list container.
              data-col-status  → pointermove walks up to this for column detection.
              data-cards-container → placeholder is appended here.
              Both attributes are on the same element so a single walk-up finds both.
            */}
            <div
              data-col-status={status}
              data-cards-container={status}
              className={`
                flex-1 rounded-xl border-2 p-2 flex flex-col gap-2
                overflow-y-auto transition-colors duration-100
                border-border-subtle ${COL_BG[status]}
              `}
              style={{ maxHeight: 'calc(100vh - 196px)' }}
            >
              {colTasks.length === 0 ? (
                <div data-empty-state="true" className="flex flex-col items-center justify-center h-28 text-center select-none">
                  <div className="w-8 h-8 rounded-lg border border-dashed border-border-strong
                                  flex items-center justify-center mb-2 bg-white">
                    <span className="text-text-muted text-sm">{COL_ICON[status]}</span>
                  </div>
                  <p className="text-text-muted text-xs font-body">No tasks here</p>
                  <p className="text-text-muted/60 text-[10px] font-body mt-0.5">
                    Drag cards to move them
                  </p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    presence={presenceMap.get(task.id) ?? []}
                    onPointerDown={handlePointerDown}
                  />
                ))
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
