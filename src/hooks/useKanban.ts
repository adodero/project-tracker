import { useState, useCallback } from "react";
import type { Task, ColumnId, Comment, Attachment } from "@/types/kanban";

const STORAGE_KEY = "kanban-tasks";

const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map((t: Task) => ({
        ...t,
        comments: t.comments || [],
        attachments: t.attachments || [],
        createdAt: new Date(t.createdAt),
      }));
    }
  } catch {}
  return [
    { id: "1", title: "Design homepage layout", description: "Create wireframes and mockups", priority: "high", columnId: "todo", assignee: "Alex", project: "Website Redesign", comments: [], attachments: [], createdAt: new Date() },
    { id: "2", title: "Set up project repo", priority: "medium", columnId: "todo", assignee: "Jordan", project: "API Platform", comments: [], attachments: [], createdAt: new Date() },
    { id: "3", title: "API integration", description: "Connect to backend services", priority: "high", columnId: "in-progress", assignee: "Sam", project: "API Platform", comments: [], attachments: [], createdAt: new Date() },
    { id: "4", title: "Write unit tests", priority: "low", columnId: "in-progress", assignee: "Taylor", project: "Mobile App", comments: [], attachments: [], createdAt: new Date() },
    { id: "5", title: "Initial research", description: "Market analysis complete", priority: "medium", columnId: "done", assignee: "Morgan", project: "Marketing", comments: [], attachments: [], createdAt: new Date() },
  ];
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const useKanban = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  }, []);

  const addTask = useCallback((title: string, columnId: ColumnId, priority: Task["priority"] = "medium", description?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      columnId,
      comments: [],
      attachments: [],
      createdAt: new Date(),
    };
    updateTasks([...tasks, newTask]);
  }, [tasks, updateTasks]);

  const moveTask = useCallback((taskId: string, toColumn: ColumnId) => {
    updateTasks(tasks.map((t) => (t.id === taskId ? { ...t, columnId: toColumn } : t)));
  }, [tasks, updateTasks]);

  const deleteTask = useCallback((taskId: string) => {
    updateTasks(tasks.filter((t) => t.id !== taskId));
  }, [tasks, updateTasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    updateTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, [tasks, updateTasks]);

  const addComment = useCallback((taskId: string, text: string) => {
    const comment: Comment = { id: Date.now().toString(), text, author: "You", createdAt: new Date() };
    updateTasks(tasks.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t));
  }, [tasks, updateTasks]);

  const addAttachment = useCallback((taskId: string, name: string, url: string) => {
    const attachment: Attachment = { id: Date.now().toString(), name, url, createdAt: new Date() };
    updateTasks(tasks.map((t) => t.id === taskId ? { ...t, attachments: [...t.attachments, attachment] } : t));
  }, [tasks, updateTasks]);

  const removeAttachment = useCallback((taskId: string, attachmentId: string) => {
    updateTasks(tasks.map((t) => t.id === taskId ? { ...t, attachments: t.attachments.filter(a => a.id !== attachmentId) } : t));
  }, [tasks, updateTasks]);

  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks.filter((t) => t.columnId === columnId);
  }, [tasks]);

  return { tasks, addTask, moveTask, deleteTask, updateTask, addComment, addAttachment, removeAttachment, getTasksByColumn };
};
