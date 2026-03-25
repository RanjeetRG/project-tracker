import type { CollabUser } from '../types';

export function CollabAvatar({ user, faded = false }: { user: CollabUser; faded?: boolean }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-semibold
                 ring-2 ring-white transition-opacity duration-700"
      style={{
        backgroundColor: user.color + '25',
        color:            user.color,
        opacity:          faded ? 0.35 : 1,
      }}
      title={user.name}
    >
      {user.initials}
    </div>
  );
}

export function PresencePill({ users }: { users: CollabUser[] }) {
  if (users.length === 0) return null;

  const visible  = users.slice(0, 2);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((u) => (
        <div
          key={u.id}
          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-semibold
                     ring-[1.5px] ring-white transition-all duration-500"
          style={{ backgroundColor: u.color + '30', color: u.color }}
          title={u.name}
        >
          {u.initials}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono
                        bg-bg-raised text-text-muted ring-[1.5px] ring-white border border-border-default">
          +{overflow}
        </div>
      )}
    </div>
  );
}
