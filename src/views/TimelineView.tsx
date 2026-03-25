// 3-month Gantt with virtualised rows

import { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react';
import type { Task, CollabUser } from '../types';
import { USERS } from '../data/seed';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../utils/constants';

const DAY_W    = 36;   // px per day column
const ROW_H    = 44;   // px per task row
const LABEL_W  = 224;  // px for the sticky label column
const HDR_H1   = 22;   // px — month label row
const HDR_H2   = 32;   // px — day number row
const HEADER_H = HDR_H1 + HDR_H2;
const BUFFER   = 3;    // overscan rows above and below the visible window

interface DayMeta {
  date:      string;   // YYYY-MM-DD
  day:       number;   // 1-31
  dow:       string;   // 'M', 'T', …
  isToday:   boolean;
  isWeekend: boolean;
  isFirst:   boolean;  // first day of a month
  monthLabel: string;  // e.g. "March 2026"
  monthSpan:  number;  // how many days this month has (only meaningful on isFirst)
}

interface TimelineViewProps {
  tasks:       Task[];
  presenceMap: Map<string, CollabUser[]>;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Build a flat list of every calendar day across 3 months
function buildDayList(anchorYear: number, anchorMonth: number): DayMeta[] {
  const list: DayMeta[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  for (let mo = -1; mo <= 1; mo++) {
    let y = anchorYear;
    let m = anchorMonth + mo;
    if (m < 0)  { m += 12; y -= 1; }
    if (m > 11) { m -= 12; y += 1; }

    const dim   = daysInMonth(y, m);
    const label = new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    for (let d = 1; d <= dim; d++) {
      const date = dateStr(y, m, d);
      const jsDate = new Date(y, m, d);
      const dow = jsDate.toLocaleDateString('en-GB', { weekday: 'narrow' });
      const day = jsDate.getDay();
      list.push({
        date,
        day:       d,
        dow,
        isToday:   date === todayStr,
        isWeekend: day === 0 || day === 6,
        isFirst:   d === 1,
        monthLabel: label,
        monthSpan:  dim,
      });
    }
  }
  return list;
}

export function TimelineView({ tasks, presenceMap }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);


  const [scrollTop, setScrollTop] = useState(0);
  const [viewH,     setViewH]     = useState(600);


  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const ro = new ResizeObserver(([e]) => setViewH(e.contentRect.height));
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  // reset scroll on filter change
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    setScrollTop(0);
  }, [tasks]);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  const dayList = useMemo(() => buildDayList(year, month), [year, month]);

  const rangeStart = dayList[0].date;
  const rangeEnd   = dayList[dayList.length - 1].date;

  // Tasks that overlap the visible range at all
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      const start = t.startDate ?? t.dueDate;
      return t.dueDate >= rangeStart && start <= rangeEnd;
    });
  }, [tasks, rangeStart, rangeEnd]);

  const gridW      = dayList.length * DAY_W;
  const totalGridH = visibleTasks.length * ROW_H;  // full height keeps scrollbar correct


  const startIdx   = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER);
  const endIdx     = Math.min(visibleTasks.length, Math.ceil((scrollTop + viewH) / ROW_H) + BUFFER);
  const slicedTasks = visibleTasks.slice(startIdx, endIdx);
  const paddingTop  = startIdx * ROW_H;

  // Find today's column index
  const todayIdx = dayList.findIndex((d) => d.isToday);
  const todayX   = todayIdx >= 0 ? todayIdx * DAY_W + DAY_W / 2 : -1;

  // For a given date string, return its index in dayList (or clamped edge)
  function dateToIdx(dateStr: string): number {
    if (dateStr <= rangeStart) return 0;
    if (dateStr >= rangeEnd)   return dayList.length - 1;
    const idx = dayList.findIndex((d) => d.date === dateStr);
    return idx >= 0 ? idx : dayList.findIndex((d) => d.date > dateStr) - 1;
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* top meta bar */}
      <div className="px-5 py-2.5 border-b border-border-subtle shrink-0 bg-white flex items-center gap-3">
        <span className="text-text-primary text-sm font-display font-semibold">
          {dayList.find((d) => d.isFirst && d.monthLabel.includes(String(year)))?.monthLabel
            ?? new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <span className="text-text-muted text-xs">·</span>
        <span className="text-text-muted text-xs font-body">{visibleTasks.length} tasks visible</span>
        <span className="text-text-muted text-xs">·</span>
        <span className="text-text-muted text-xs font-body">scroll ↔ for dates, ↕ for tasks</span>
      </div>

      {/* scrollable area — both axes */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-white"
        style={{ minHeight: 0 }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ minWidth: LABEL_W + gridW, position: 'relative' }}>

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div
            className="flex border-b border-border-subtle bg-white"
            style={{ position: 'sticky', top: 0, zIndex: 30, height: HEADER_H }}
          >
            {/* corner cell */}
            <div
              className="shrink-0 bg-white border-r border-border-subtle flex items-end px-3"
              style={{ position: 'sticky', left: 0, zIndex: 40, width: LABEL_W, height: HEADER_H }}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted select-none pb-1.5">
                Task
              </span>
            </div>

            {/* day columns — two rows stacked via absolute positioning */}
            <div className="relative flex-1 overflow-hidden" style={{ width: gridW }}>

              {/* Row 1: month labels */}
              <div className="absolute top-0 left-0 flex" style={{ height: HDR_H1 }}>
                {dayList
                  .filter((d) => d.isFirst)
                  .map((first) => (
                    <div
                      key={first.date}
                      className="flex items-center px-2 border-r border-border-subtle bg-white shrink-0"
                      style={{ width: first.monthSpan * DAY_W, height: HDR_H1 }}
                    >
                      <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider select-none">
                        {first.monthLabel}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Row 2: day numbers */}
              <div
                className="absolute left-0 flex border-t border-border-subtle"
                style={{ top: HDR_H1, height: HDR_H2 }}
              >
                {dayList.map((d, i) => (
                  <div
                    key={i}
                    className={`shrink-0 flex flex-col items-center justify-center border-r py-0.5 ${
                      d.isToday   ? 'bg-indigo-50 border-r-indigo-200'
                      : d.isWeekend ? 'bg-slate-50 border-r-border-subtle'
                      : 'border-r-border-subtle'
                    }`}
                    style={{ width: DAY_W, height: HDR_H2 }}
                  >
                    <span className={`text-[9px] font-mono leading-none mb-0.5 ${d.isToday ? 'text-indigo-500' : 'text-text-muted/40'}`}>
                      {d.dow}
                    </span>
                    <span className={`text-[11px] font-mono font-medium ${
                      d.isToday   ? 'text-indigo-600 font-bold'
                      : d.isWeekend ? 'text-text-muted/40'
                      : d.isFirst  ? 'text-text-secondary font-semibold'
                      : 'text-text-muted'
                    }`}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── BODY ────────────────────────────────────────────────────── */}
          {visibleTasks.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-text-muted text-sm font-body">
              No tasks fall within this range
            </div>
          ) : (
            <div className="relative flex">

              {/* sticky label column — renders only the visible row slice */}
              <div
                className="shrink-0 border-r border-border-subtle bg-white"
                style={{ position: 'sticky', left: 0, zIndex: 20, width: LABEL_W }}
              >
                {/* spacer pushes sliced rows to the correct vertical offset */}
                <div style={{ height: paddingTop }} />
                {slicedTasks.map((task) => {
                  const assignee = USERS.find((u) => u.id === task.assigneeId)!;
                  const presence = presenceMap.get(task.id) ?? [];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-3 border-b border-border-subtle hover:bg-slate-50 transition-colors"
                      style={{ height: ROW_H }}
                    >
                      {presence.length > 0 && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono shrink-0 animate-fade-in"
                          style={{ backgroundColor: presence[0].color + '25', color: presence[0].color }}
                          title={presence[0].name}
                        >
                          {presence[0].initials}
                        </div>
                      )}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-semibold shrink-0"
                        style={{ backgroundColor: assignee.color + '20', color: assignee.color }}
                        title={assignee.name}
                      >
                        {assignee.initials}
                      </div>
                      <span className="text-text-secondary text-xs font-body truncate">{task.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* scrollable grid — full totalGridH canvas so scrollbar is correct */}
              <div className="relative flex-1" style={{ width: gridW, height: totalGridH }}>

                {/* weekend shading — full height, no windowing needed */}
                {dayList.map((d, i) =>
                  d.isWeekend ? (
                    <div
                      key={i}
                      className="absolute inset-y-0 bg-slate-50/80"
                      style={{ left: i * DAY_W, width: DAY_W }}
                    />
                  ) : null
                )}

                {/* month boundary lines — full height, no windowing needed */}
                {dayList.map((d, i) =>
                  d.isFirst && i > 0 ? (
                    <div
                      key={`mb-${i}`}
                      className="absolute inset-y-0"
                      style={{ left: i * DAY_W, width: 1, background: '#c7d0e8' }}
                    />
                  ) : null
                )}

                {/* vertical grid lines — full height, no windowing needed */}
                {dayList.map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 border-r border-border-subtle/60"
                    style={{ left: (i + 1) * DAY_W - 1, width: 1 }}
                  />
                ))}

                {/* horizontal row dividers — spans all rows, no windowing needed */}
                {visibleTasks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-border-subtle/60"
                    style={{ top: (i + 1) * ROW_H - 1 }}
                  />
                ))}

                {/* today line — full height, no windowing needed */}
                {todayX >= 0 && (
                  <div
                    className="absolute inset-y-0 z-10 pointer-events-none"
                    style={{
                      left:       todayX,
                      width:      2,
                      background: 'linear-gradient(to bottom, #6366f1, #818cf8)',
                      opacity:    0.7,
                    }}
                  />
                )}

                {/* task bars — windowed */}
                {slicedTasks.map((task, rowIdx) => {
                  const color   = PRIORITY_COLORS[task.priority];
                  const noStart = !task.startDate;

                  const colEnd   = clamp(dateToIdx(task.dueDate),              0, dayList.length - 1);
                  const colStart = noStart
                    ? colEnd
                    : clamp(dateToIdx(task.startDate!),  0, dayList.length - 1);

                  const barLeft   = colStart * DAY_W;
                  const barWidth  = Math.max(DAY_W, (colEnd - colStart + 1) * DAY_W);
                  const barHeight = noStart ? 8 : 22;
                  // rowIdx is local to the slice — add the window startIdx so the
                  // bar lands at the correct absolute position on the full canvas.
                  const barTop    = (rowIdx + startIdx) * ROW_H + (ROW_H - barHeight) / 2;

                  return (
                    <div
                      key={task.id}
                      className="absolute z-20"
                      style={{
                        left:            barLeft + 3,
                        top:             barTop,
                        width:           noStart ? DAY_W - 6 : barWidth - 6,
                        height:          barHeight,
                        borderRadius:    noStart ? 99 : 4,
                        backgroundColor: color + '20',
                        border:          `1px solid ${color}45`,
                      }}
                      title={`${task.title} · ${noStart ? task.dueDate : `${task.startDate} → ${task.dueDate}`}`}
                    >
                      {!noStart && (
                        <div
                          className="h-full rounded-[3px]"
                          style={{ background: `linear-gradient(90deg, ${color}55, ${color}15)` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* legend */}
      <div className="px-5 py-2 border-t border-border-subtle shrink-0 bg-bg-raised/40 flex items-center gap-5 flex-wrap">
        <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest select-none">Priority</span>
        {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
            <span className="text-text-muted text-[10px] font-body">{PRIORITY_LABELS[p]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-0.5 h-3 bg-indigo-500 opacity-70 rounded-full" />
          <span className="text-text-muted text-[10px] font-body">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-300 border border-gray-200" />
          <span className="text-text-muted text-[10px] font-body">No start date</span>
        </div>
      </div>
    </div>
  );
}
