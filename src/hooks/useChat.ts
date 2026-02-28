import { useState, useCallback } from "react";
import type { ChatMessage } from "@/types/kanban";

const STORAGE_KEY = "kanban-chat-messages";

const loadMessages = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored).map((m: ChatMessage) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
    }
  } catch {}
  return [];
};

const saveMessages = (messages: ChatMessage[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);

  const addMessage = useCallback(
    (taskId: string, text: string, author: string = "You") => {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        taskId,
        text,
        author,
        createdAt: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, msg];
        saveMessages(updated);
        return updated;
      });
    },
    []
  );

  const getMessagesByTask = useCallback(
    (taskId: string) => messages.filter((m) => m.taskId === taskId),
    [messages]
  );

  const getLastMessage = useCallback(
    (taskId: string) => {
      const taskMessages = messages.filter((m) => m.taskId === taskId);
      return taskMessages.length > 0 ? taskMessages[taskMessages.length - 1] : null;
    },
    [messages]
  );

  return { messages, addMessage, getMessagesByTask, getLastMessage };
};
