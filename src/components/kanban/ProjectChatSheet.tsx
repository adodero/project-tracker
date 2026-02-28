import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, ChatMessage } from "@/types/kanban";
import { useChat } from "@/hooks/useChat";
import { useEffectiveKeyboardHeight } from "@/hooks/useKeyboardOffset";
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Circle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface ProjectChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

const columnLabel: Record<string, { label: string; icon: typeof Circle }> = {
  todo: { label: "To Do", icon: Circle },
  "in-progress": { label: "In Progress", icon: Clock },
  done: { label: "Done", icon: CheckCircle2 },
};

const columnColor: Record<string, string> = {
  todo: "text-muted-foreground",
  "in-progress": "text-amber-500",
  done: "text-emerald-500",
};

export const ProjectChatSheet = ({
  open,
  onOpenChange,
  tasks,
}: ProjectChatSheetProps) => {
  const { addMessage, getMessagesByTask, getLastMessage } = useChat();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const kbHeight = useEffectiveKeyboardHeight();
  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId) || null
    : null;
  const activeMessages = activeTaskId
    ? getMessagesByTask(activeTaskId)
    : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages.length]);

  useEffect(() => {
    if (activeTaskId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTaskId]);

  useEffect(() => {
    if (!open) {
      setActiveTaskId(null);
      setInput("");
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || !activeTaskId) return;
    addMessage(activeTaskId, input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aLast = getLastMessage(a.id);
    const bLast = getLastMessage(b.id);
    if (aLast && bLast) return bLast.createdAt.getTime() - aLast.createdAt.getTime();
    if (aLast) return -1;
    if (bLast) return 1;
    return 0;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        data-testid="project-chat-sheet"
      >
        {!activeTask ? (
          <>
            <SheetHeader className="p-4 pb-2 border-b border-border/50">
              <SheetTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4" />
                Project Chat
              </SheetTitle>
              <SheetDescription className="text-xs">
                Select a task to view or start a conversation thread.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/50">
                {sortedTasks.map((task) => {
                  const lastMsg = getLastMessage(task.id);
                  const msgCount = getMessagesByTask(task.id).length;
                  const StatusIcon =
                    columnLabel[task.columnId]?.icon || Circle;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setActiveTaskId(task.id)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-all duration-200 flex gap-3 items-start active:scale-[0.98] active:bg-secondary/70"
                      data-testid={`chat-task-${task.id}`}
                    >
                      <div className="mt-0.5">
                        <StatusIcon
                          className={`w-4 h-4 ${columnColor[task.columnId] || "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </span>
                          {msgCount > 0 && (
                            <span className="shrink-0 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              {msgCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[11px] font-medium ${columnColor[task.columnId] || "text-muted-foreground"}`}
                          >
                            {columnLabel[task.columnId]?.label || task.columnId}
                          </span>
                          {task.assignee && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-[11px] text-muted-foreground">
                                {task.assignee}
                              </span>
                            </>
                          )}
                        </div>
                        {lastMsg && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {lastMsg.author}: {lastMsg.text}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
                {sortedTasks.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No tasks yet. Create a task to start chatting.
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-4 border-b border-border/50">
              <button
                onClick={() => {
                  setActiveTaskId(null);
                  setInput("");
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-all duration-200 active:scale-90 group/back"
                data-testid="chat-back-button"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover/back:-translate-x-0.5" />
              </button>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-sm font-semibold truncate">
                  {activeTask.title}
                </SheetTitle>
                <SheetDescription className="text-[11px]">
                  {columnLabel[activeTask.columnId]?.label}
                  {activeTask.assignee && ` · ${activeTask.assignee}`}
                  {activeTask.project && ` · ${activeTask.project}`}
                </SheetDescription>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              data-testid="chat-messages-area"
            >
              {activeMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 py-12">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">
                    Start the conversation for this task.
                  </p>
                </div>
              )}
              {activeMessages.map((msg: ChatMessage) => {
                const isYou = msg.author === "You";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col animate-slide-up anim-fill-both ${isYou ? "items-end" : "items-start"}`}
                    data-testid={`chat-message-${msg.id}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm transition-all duration-200 ${
                        isYou
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {!isYou && (
                        <span className="text-[11px] font-semibold block mb-0.5 opacity-70">
                          {msg.author}
                        </span>
                      )}
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {format(msg.createdAt, "MMM d, h:mm a")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="p-3 border-t border-border/50 transition-[padding] duration-150"
              style={{
                paddingBottom: kbHeight > 0
                  ? `${kbHeight + 12}px`
                  : undefined
              }}
            >
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 py-1.5"
                  data-testid="chat-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-all duration-200 hover:brightness-110 active:scale-90 disabled:active:scale-100"
                  data-testid="chat-send-button"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
