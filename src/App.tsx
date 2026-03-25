import { useMemo } from 'react';
import { useStore, getFilteredTasks, getSortedTasks } from './store/store';
import { useURLFilters } from './hooks/useURLFilters';
import { useCollaboration } from './hooks/useCollaboration';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import { TimelineView } from './views/TimelineView';

export default function App() {
  const { tasks, view, filters, sort } = useStore();
  const { hasActiveFilters, clearFilters } = useURLFilters();

  const filteredTasks = useMemo(
    () => getFilteredTasks(tasks, filters),
    [tasks, filters],
  );
  const sortedTasks = useMemo(
    () => getSortedTasks(filteredTasks, sort),
    [filteredTasks, sort],
  );

  const { collabUsers, presenceMap, activeCount } = useCollaboration(filteredTasks);

  return (
    <div className="h-screen flex flex-col bg-bg-base text-text-primary overflow-hidden font-body">
      <Header collabUsers={collabUsers} activeCount={activeCount} />
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters} />

      <main className="flex-1 min-h-0 overflow-hidden">
        {view === 'kanban' && (
          <KanbanView tasks={filteredTasks} presenceMap={presenceMap} />
        )}
        {view === 'list' && (
          <ListView
            tasks={sortedTasks}
            presenceMap={presenceMap}
            onClearFilters={hasActiveFilters ? clearFilters : undefined}
          />
        )}
        {view === 'timeline' && (
          <TimelineView tasks={filteredTasks} presenceMap={presenceMap} />
        )}
      </main>
    </div>
  );
}
