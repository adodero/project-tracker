import { useState } from "react";
import { useKanban } from "@/hooks/useKanban";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { SettingsDialog } from "./SettingsDialog";
import { ProjectChatSheet } from "./ProjectChatSheet";
import type { Task, ColumnId } from "@/types/kanban";
import { Layout, Moon, Sun, Settings, MessageSquare } from "lucide-react";

const columns: { id: ColumnId; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export const KanbanBoard = () => {
  const { addTask, moveTask, deleteTask, updateTask, addComment, addAttachment, removeAttachment, getTasksByColumn, tasks } = useKanban();
  const { dark, toggle } = useTheme();
  const { teamMembers, projects, updateTeamMembers, updateProjects } = useSettings();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const liveTask = selectedTask ? tasks.find((t) => t.id === selectedTask.id) || null : null;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 safe-area-top animate-slide-down">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center animate-pop-in">
            <Layout className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground tracking-tight">Project Tracker</h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              {columns.reduce((sum, col) => sum + getTasksByColumn(col.id).length, 0)} tasks
            </p>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-2 px-3 text-sm font-medium transition-all duration-200 active:scale-95 hover:shadow-sm"
            aria-label="Project Chat"
            data-testid="button-project-chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Project Chat</span>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 hover:shadow-sm group/settings"
            aria-label="Settings"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4 transition-transform duration-300 group-hover/settings:rotate-90" />
          </button>
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 hover:shadow-sm"
            aria-label="Toggle theme"
            data-testid="button-toggle-theme"
          >
            {dark ? <Sun className="w-4 h-4 animate-scale-in" /> : <Moon className="w-4 h-4 animate-scale-in" />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide snap-x snap-mandatory md:snap-none">
        <div className="flex gap-0 md:gap-4 px-0 md:px-6 py-4 md:py-6 max-w-6xl mx-auto min-h-full">
          {columns.map((col) => {
            const colTasks = getTasksByColumn(col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={colTasks}
                count={colTasks.length}
                onMove={moveTask}
                onDelete={deleteTask}
                onAdd={addTask}
                onOpenTask={openTask}
              />
            );
          })}
        </div>
      </main>

      <TaskDetailDialog
        task={liveTask}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={updateTask}
        onAddComment={addComment}
        onAddAttachment={addAttachment}
        onRemoveAttachment={removeAttachment}
        onDelete={deleteTask}
        onMove={moveTask}
        teamMembers={teamMembers}
        projects={projects}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        teamMembers={teamMembers}
        projects={projects}
        onUpdateTeamMembers={updateTeamMembers}
        onUpdateProjects={updateProjects}
      />

      <ProjectChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        tasks={tasks}
      />
    </div>
  );
};
