import { useState } from "react";
import type { Task, ColumnId } from "@/types/kanban";
import { Trash2, ChevronRight, ChevronLeft, User, FolderOpen, ShieldAlert } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, toColumn: ColumnId) => void;
  onDelete: (taskId: string) => void;
  onOpen: (task: Task) => void;
}

const priorityConfig = {
  low: { label: "Low", className: "bg-kanban-done text-kanban-done-accent" },
  medium: { label: "Med", className: "bg-kanban-progress text-kanban-progress-accent" },
  high: { label: "High", className: "bg-accent text-accent-foreground" },
};

const nextColumn: Record<ColumnId, ColumnId | null> = {
  todo: "in-progress",
  "in-progress": "done",
  done: null,
};

const prevColumn: Record<ColumnId, ColumnId | null> = {
  todo: null,
  "in-progress": "todo",
  done: "in-progress",
};

export const TaskCard = ({ task, onMove, onDelete, onOpen }: TaskCardProps) => {
  const [swiping, setSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const priority = priorityConfig[task.priority];
  const canMoveForward = nextColumn[task.columnId] !== null;
  const canMoveBack = prevColumn[task.columnId] !== null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX;
    const clamped = Math.max(-80, Math.min(80, diff));
    setOffsetX(clamped);
  };

  const handleTouchEnd = () => {
    if (offsetX > 60 && canMoveForward) {
      onMove(task.id, nextColumn[task.columnId]!);
    } else if (offsetX < -60 && canMoveBack) {
      onMove(task.id, prevColumn[task.columnId]!);
    }
    setOffsetX(0);
    setSwiping(false);
  };

  return (
    <div
      className={[
        "relative rounded-lg bg-card p-4 border animate-slide-up anim-fill-both select-none cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-200 ease-out",
        "active:scale-[0.97] hover:translate-y-[-1px]",
        task.blocked
          ? "border-red-400/70 animate-blocked-pulse"
          : "border-border/50",
        task.columnId === "in-progress" && !task.blocked
          ? "animate-pulse-subtle"
          : "",
      ].join(" ")}
      style={{
        transform: offsetX ? `translateX(${offsetX}px)` : undefined,
        transition: swiping ? "none" : "all 0.2s cubic-bezier(0.16,1,0.3,1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onOpen(task)}
      data-testid={`card-task-${task.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-card-foreground leading-snug flex-1">{task.title}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 min-w-[28px] min-h-[28px] flex items-center justify-center group/del"
          aria-label="Delete task"
          data-testid={`button-delete-${task.id}`}
        >
          <Trash2 className="w-3.5 h-3.5 group-hover/del:animate-shake" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {task.assignee && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <User className="w-3 h-3" /> {task.assignee}
          </span>
        )}
        {task.project && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <FolderOpen className="w-3 h-3" /> {task.project}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-200 ${priority.className}`}>
            {priority.label}
          </span>
          {task.blocked && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 animate-pop-in" data-testid={`badge-blocked-${task.id}`}>
              <ShieldAlert className="w-2.5 h-2.5" />
              Blocked
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canMoveBack && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(task.id, prevColumn[task.columnId]!); }}
              className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-all duration-200 p-1 group/back"
              data-testid={`button-reopen-${task.id}`}
            >
              <ChevronLeft className="w-3 h-3 group-hover/back:animate-bounce-left" /> Reopen
            </button>
          )}
          {canMoveForward && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(task.id, nextColumn[task.columnId]!); }}
              className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-all duration-200 p-1 -mr-1 group/fwd"
              data-testid={`button-move-${task.id}`}
            >
              Move <ChevronRight className="w-3 h-3 group-hover/fwd:animate-bounce-right" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
