export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Status   = 'todo' | 'in-progress' | 'in-review' | 'done';
export type ViewMode = 'kanban' | 'list' | 'timeline';
export type SortField = 'title' | 'priority' | 'dueDate';

export interface User {
  id:       string;
  name:     string;
  initials: string;
  color:    string;
}

export interface Task {
  id:         string;
  title:      string;
  status:     Status;
  priority:   Priority;
  assigneeId: string;
  startDate?: string;
  dueDate:    string;
  createdAt:  string;
}

export interface FilterState {
  status:      Status[];
  priority:    Priority[];
  assignees:   string[];
  dueDateFrom: string;
  dueDateTo:   string;
}

export interface SortState {
  field: SortField;
  dir:   'asc' | 'desc';
}

export interface CollabUser {
  id:       string;
  name:     string;
  initials: string;
  color:    string;
  taskId:   string | null;
}
