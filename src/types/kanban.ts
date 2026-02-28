export type ColumnId = "todo" | "in-progress" | "done";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  columnId: ColumnId;
  assignee?: string;
  project?: string;
  blocked?: boolean;
  comments: Comment[];
  attachments: Attachment[];
  createdAt: Date;
}

export interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

export interface ChatMessage {
  id: string;
  taskId: string;
  text: string;
  author: string;
  createdAt: Date;
}

export const DEFAULT_TEAM_MEMBERS = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey"];
export const DEFAULT_PROJECTS = ["Website Redesign", "Mobile App", "API Platform", "Marketing", "Infrastructure"];
