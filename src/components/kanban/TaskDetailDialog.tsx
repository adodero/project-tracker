import { useState, useEffect, useRef, useCallback } from "react";
import type { Task, ColumnId } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffectiveKeyboardHeight } from "@/hooks/useKeyboardOffset";
import { User, FolderOpen, MessageSquare, Paperclip, Send, X, Trash2, RotateCcw, ChevronDown, ShieldAlert } from "lucide-react";

const prevColumn: Record<ColumnId, ColumnId | null> = {
  todo: null,
  "in-progress": "todo",
  done: "in-progress",
};

const columnLabels: Record<ColumnId, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onAddComment: (taskId: string, text: string) => void;
  onAddAttachment: (taskId: string, name: string, url: string) => void;
  onRemoveAttachment: (taskId: string, attachmentId: string) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, toColumn: ColumnId) => void;
  teamMembers: string[];
  projects: string[];
}

const priorityConfig = {
  low: { label: "Low", className: "bg-kanban-done text-kanban-done-accent" },
  medium: { label: "Med", className: "bg-kanban-progress text-kanban-progress-accent" },
  high: { label: "High", className: "bg-accent text-accent-foreground" },
};

interface CollapsibleSectionProps {
  icon: typeof User;
  label: string;
  summary?: string;
  children: React.ReactNode;
  testId: string;
  resetKey: string;
}

const CollapsibleSection = ({ icon: Icon, label, summary, children, testId, resetKey }: CollapsibleSectionProps) => {
  const isDesktop = () => window.matchMedia("(min-width: 640px)").matches;
  const [open, setOpen] = useState(isDesktop);

  useEffect(() => {
    setOpen(isDesktop());
  }, [resetKey]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = (e: MediaQueryListEvent) => {
      setOpen(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
        data-testid={`toggle-${testId}`}
      >
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          {label}
        </span>
        {!open && summary && (
          <span className="text-[11px] text-muted-foreground/70 truncate max-w-[40%]">{summary}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
};

export const TaskDetailDialog = ({
  task,
  open,
  onOpenChange,
  onUpdate,
  onAddComment,
  onAddAttachment,
  onRemoveAttachment,
  onDelete,
  onMove,
  teamMembers,
  projects,
}: TaskDetailDialogProps) => {
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [commentText, setCommentText] = useState("");
  const [attachName, setAttachName] = useState("");
  const kbHeight = useEffectiveKeyboardHeight();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const scrollInputIntoView = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        if (target.isConnected) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);
    }
  }, []);

  if (!task) return null;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && task) {
      setEditTitle(task.title);
      setEditDesc(task.description || "");
    }
    onOpenChange(isOpen);
  };

  const saveBasicEdits = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdate(task.id, { title: editTitle.trim() });
    }
    if (editDesc !== (task.description || "")) {
      onUpdate(task.id, { description: editDesc.trim() || undefined });
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(task.id, commentText.trim());
      setCommentText("");
    }
  };

  const handleFileUpload = () => {
    if (attachName.trim()) {
      onAddAttachment(task.id, attachName.trim(), "#");
      setAttachName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="max-w-lg flex flex-col p-0 gap-0 transition-[max-height] duration-150"
        style={{
          maxHeight: kbHeight > 0
            ? `calc(100dvh - ${kbHeight}px - 2rem)`
            : '85dvh',
        }}
        data-testid="task-detail-dialog"
      >
        <DialogHeader className="p-5 pb-3 shrink-0">
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
          <input
            value={editTitle || task.title}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveBasicEdits}
            className="text-lg font-bold bg-transparent outline-none w-full text-foreground"
            data-testid="input-task-title"
          />
          <div className="flex items-center gap-2 mt-1">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate(task.id, { priority: p })}
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize transition-all ${
                  task.priority === p ? "ring-2 ring-ring/30 scale-105" : "opacity-50"
                } ${priorityConfig[p].className}`}
                data-testid={`button-priority-${p}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onUpdate(task.id, { blocked: !task.blocked })}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-all duration-200 ml-auto active:scale-90 ${
                task.blocked
                  ? "bg-red-100 text-red-600 ring-2 ring-red-300/50 dark:bg-red-950 dark:text-red-400 dark:ring-red-500/30"
                  : "bg-secondary text-muted-foreground opacity-50 hover:opacity-80"
              }`}
              data-testid="button-toggle-blocked"
            >
              <ShieldAlert className="w-3 h-3" />
              Blocked
            </button>
          </div>
        </DialogHeader>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-5 pb-4 space-y-3" onFocusCapture={scrollInputIntoView}>
          <CollapsibleSection
            icon={MessageSquare}
            label="Description"
            summary={task.description || "No description"}
            testId="description"
            resetKey={`${task.id}-${open}`}
          >
            <Textarea
              value={editDesc || task.description || ""}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={saveBasicEdits}
              placeholder="Add a description..."
              className="min-h-[60px] text-sm resize-none"
              data-testid="input-task-description"
            />
          </CollapsibleSection>

          <CollapsibleSection
            icon={User}
            label="Assigned to"
            summary={task.assignee || "Unassigned"}
            testId="assignee"
            resetKey={`${task.id}-${open}`}
          >
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.map((name) => (
                <button
                  key={name}
                  onClick={() => onUpdate(task.id, { assignee: task.assignee === name ? undefined : name })}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all min-h-[32px] ${
                    task.assignee === name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                  data-testid={`button-assignee-${name}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={FolderOpen}
            label="Project"
            summary={task.project || "No project"}
            testId="project"
            resetKey={`${task.id}-${open}`}
          >
            <div className="flex flex-wrap gap-1.5">
              {projects.map((proj) => (
                <button
                  key={proj}
                  onClick={() => onUpdate(task.id, { project: task.project === proj ? undefined : proj })}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all min-h-[32px] ${
                    task.project === proj
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                  data-testid={`button-project-${proj}`}
                >
                  {proj}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={Paperclip}
            label="Attachments"
            summary={task.attachments.length > 0 ? `${task.attachments.length} file${task.attachments.length > 1 ? "s" : ""}` : "None"}
            testId="attachments"
            resetKey={`${task.id}-${open}`}
          >
            {task.attachments.length > 0 && (
              <div className="space-y-1 mb-2">
                {task.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-secondary rounded-md px-3 py-2 text-xs" data-testid={`attachment-${a.id}`}>
                    <span className="text-foreground font-medium truncate">{a.name}</span>
                    <button onClick={() => onRemoveAttachment(task.id, a.id)} className="text-muted-foreground hover:text-destructive p-1" data-testid={`button-remove-attachment-${a.id}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={attachName}
                onChange={(e) => setAttachName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFileUpload()}
                placeholder="Attachment name..."
                className="text-xs h-9"
                data-testid="input-attachment-name"
              />
              <button
                onClick={handleFileUpload}
                className="px-3 h-9 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                data-testid="button-add-attachment"
              >
                Add
              </button>
            </div>
          </CollapsibleSection>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" /> Comments
            </label>
            {task.comments.length > 0 && (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {task.comments.map((c) => (
                  <div key={c.id} className="bg-secondary rounded-md px-3 py-2" data-testid={`comment-${c.id}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{c.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Write a comment..."
                className="text-xs h-9"
                data-testid="input-comment"
              />
              <button
                onClick={handleAddComment}
                className="p-2 h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:brightness-110 active:scale-90 transition-all duration-150"
                data-testid="button-send-comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {prevColumn[task.columnId] && (
            <button
              onClick={() => { onMove(task.id, prevColumn[task.columnId]!); }}
              className="flex items-center gap-2 text-xs text-primary hover:bg-primary/10 rounded-md px-3 py-2 w-full transition-all duration-200 min-h-[40px] active:scale-[0.98] group/reopen"
              data-testid="button-reopen-task"
            >
              <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover/reopen:-rotate-180" /> Reopen — move to {columnLabels[prevColumn[task.columnId]!]}
            </button>
          )}

          <button
            onClick={() => { onDelete(task.id); onOpenChange(false); }}
            className="flex items-center gap-2 text-xs text-destructive hover:bg-destructive/10 rounded-md px-3 py-2 w-full transition-all duration-200 min-h-[40px] active:scale-[0.98] group/del"
            data-testid="button-delete-task"
          >
            <Trash2 className="w-3.5 h-3.5 group-hover/del:animate-shake" /> Delete this task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
