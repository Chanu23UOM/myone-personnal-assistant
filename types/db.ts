export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Settings {
  user_id: string;
  notes_folder_id: string | null;
  interests: string[] | null;
  news_keywords: string[] | null;
  updated_at: string;
}

export type TaskPriority = "low" | "normal" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  semester_week: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  calendar_event_id: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  remind_at: string;
  created_at: string;
}

export interface SemesterNote {
  id: string;
  user_id: string;
  note_date: string;
  semester_week: number | null;
  content: string | null;
  created_at: string;
}

export interface WorkflowStep {
  title: string;
  detail: string;
  estimate_minutes: number;
  done?: boolean;
}

export interface Workflow {
  id: string;
  user_id: string;
  source_note_id: string | null;
  title: string | null;
  steps: WorkflowStep[];
  created_at: string;
}

export type AiSuggestionType = "idea" | "progress" | "news";

export interface AiSuggestion<TPayload = unknown> {
  id: string;
  user_id: string;
  type: AiSuggestionType;
  payload: TPayload;
  created_at: string;
}

export interface ProgressPayload {
  summary: string;
  whats_behind: string[];
  suggested_priorities: string[];
}

export interface IdeasPayload {
  ideas: { idea: string; why: string }[];
}

export interface NewsPayload {
  items: {
    title: string;
    summary: string;
    why_relevant: string;
    url: string;
    source: string;
  }[];
}
