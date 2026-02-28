import { useState, useRef, useEffect, useCallback } from "react";
import type { Task, ColumnId } from "@/types/kanban";
import { TaskCard } from "./TaskCard";
import { Plus, X } from "lucide-react";

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
  count: number;
  onMove: (taskId: string, toColumn: ColumnId) => void;
  onDelete: (taskId: string) => void;
  onAdd: (title: string, columnId: ColumnId, priority: Task["priority"], description?: string) => void;
  onOpenTask: (task: Task) => void;
}

const columnStyles: Record<ColumnId, { bg: string; accent: string; dot: string }> = {
  todo: { bg: "bg-kanban-todo", accent: "text-kanban-todo-accent", dot: "bg-kanban-todo-accent" },
  "in-progress": { bg: "bg-kanban-progress", accent: "text-kanban-progress-accent", dot: "bg-kanban-progress-accent" },
  done: { bg: "bg-kanban-done", accent: "text-kanban-done-accent", dot: "bg-kanban-done-accent" },
};

export const KanbanColumn = ({ id, title, tasks, count, onMove, onDelete, onAdd, onOpenTask }: KanbanColumnProps) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const style = columnStyles[id];
  const addCardRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!adding) return;
    const timer = setTimeout(() => {
      addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [adding]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleInputFocus = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  }, []);

  const handleSubmit = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim(), id, newPriority);
      setNewTitle("");
      setNewPriority("medium");
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col w-[100vw] min-w-[100vw] md:w-80 md:min-w-0 md:flex-1 flex-shrink-0 snap-center px-4 md:px-0">
      <div className={`flex items-center gap-2.5 px-3 py-3 rounded-t-lg ${style.bg} animate-fade-in`}>
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot} animate-pop-in`} />
        <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
        <span className={`text-xs font-semibold ${style.accent} ml-auto tabular-nums animate-scale-in`}>{count}</span>
      </div>

      <div className="flex flex-col gap-2.5 p-2.5 bg-secondary/30 rounded-b-lg min-h-[120px] flex-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMove={onMove} onDelete={onDelete} onOpen={onOpenTask} />
        ))}

        {adding ? (
          <div ref={addCardRef} className="rounded-lg bg-card border border-border p-3 space-y-2.5 animate-slide-up shadow-sm">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onFocus={handleInputFocus}
              placeholder="Task title..."
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
              data-testid="input-new-task-title"
            />
            <div className="flex items-center gap-2">
              {(["low", "medium", "high"] as const).map((p, i) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize transition-all duration-200 animate-scale-in anim-fill-both ${
                    i === 0 ? "stagger-1" : i === 1 ? "stagger-2" : "stagger-3"
                  } ${
                    newPriority === p ? "ring-2 ring-primary/30 scale-105" : "opacity-60 hover:opacity-80"
                  } ${
                    p === "low" ? "bg-kanban-done text-kanban-done-accent" :
                    p === "medium" ? "bg-kanban-progress text-kanban-progress-accent" :
                    "bg-accent text-accent-foreground"
                  }`}
                  data-testid={`button-new-priority-${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2 animate-fade-in anim-fill-both stagger-3">
              <button
                onClick={handleSubmit}
                className="flex-1 text-xs font-semibold bg-primary text-primary-foreground rounded-md py-2 hover:brightness-110 active:scale-[0.96] transition-all duration-150"
                data-testid="button-submit-task"
              >
                Add Task
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle(""); }}
                className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 active:scale-90"
                data-testid="button-cancel-add"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-lg hover:bg-card/60 transition-all duration-200 active:scale-[0.96] min-h-[44px] group/add"
            data-testid={`button-add-task-${id}`}
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover/add:rotate-90" />
            <span className="font-medium">Add task</span>
          </button>
        )}
      </div>
    </div>
  );
};
