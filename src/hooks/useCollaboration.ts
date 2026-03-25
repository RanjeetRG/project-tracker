// fake users that randomly hop between tasks every few seconds

import { useState, useEffect, useRef } from 'react';
import type { CollabUser, Task } from '../types';


const COLLAB_POOL: CollabUser[] = [
  { id: 'c1', name: 'Sneha Gupta', initials: 'SG', color: '#a78bfa', taskId: null },
  { id: 'c2', name: 'Tanvi Joshi', initials: 'TJ', color: '#34d399', taskId: null },
  { id: 'c3', name: 'Vikram Singh', initials: 'VS', color: '#fb923c', taskId: null },
];

function pickDifferent(ids: string[], current: string | null): string {
  const pool = ids.filter((id) => id !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useCollaboration(tasks: Task[]) {
  const [users, setUsers] = useState<CollabUser[]>(() =>
    // seed each user onto a different task at startup
    COLLAB_POOL.map((u, i) => ({
      ...u,
      taskId: tasks[i * 13 % Math.max(tasks.length, 1)]?.id ?? null,
    }))
  );

  // keep a ref so the interval closure doesn't go stale
  const taskIdsRef = useRef<string[]>([]);
  taskIdsRef.current = tasks.map((t) => t.id);

  // re-sync users when the task list changes (e.g. new filter)
  useEffect(() => {
    if (tasks.length === 0) {
      setUsers((prev) => prev.map((u) => ({ ...u, taskId: null })));
      return;
    }
    const ids = tasks.map((t) => t.id);
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        taskId:
          u.taskId && ids.includes(u.taskId)
            ? u.taskId
            : ids[Math.floor(Math.random() * ids.length)],
      }))
    );
  }, [tasks]);

  useEffect(() => {
    if (taskIdsRef.current.length === 0) return;

    const timer = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => {
          // each user has about a 40% chance of moving per tick
          if (Math.random() > 0.4) return u;
          const next = pickDifferent(taskIdsRef.current, u.taskId);
          return { ...u, taskId: next };
        })
      );
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  // build presence map: taskId → who's on it
  const presenceMap = new Map<string, CollabUser[]>();
  for (const u of users) {
    if (!u.taskId || !taskIdsRef.current.includes(u.taskId)) continue;
    const existing = presenceMap.get(u.taskId) ?? [];
    presenceMap.set(u.taskId, [...existing, u]);
  }

  const activeCount = users.filter(
    (u) => u.taskId !== null && taskIdsRef.current.includes(u.taskId),
  ).length;

  return { collabUsers: users, presenceMap, activeCount };
}
