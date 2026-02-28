# Project Tracker App

A Kanban-style project tracker application built with React, Vite, and shadcn/ui components. Migrated from Lovable to Replit.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router DOM v6
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **State/Data**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS

## Features

- **Kanban Board**: Drag tasks between To Do, In Progress, and Done columns
- **Blocked Status**: Tasks can be marked as "Blocked" — blocked cards display a red glow effect and a "Blocked" badge. Toggle via the task detail dialog.
- **Project Chat**: Per-task chat threads accessible via the "Project Chat" button in the header. Messages are persisted in localStorage. Each task has its own conversation archive.

## Project Structure

```
src/
  App.tsx          - Root app with routing and providers
  pages/
    Index.tsx      - Main kanban board page
    NotFound.tsx   - 404 page
  components/
    kanban/
      KanbanBoard.tsx      - Main board with header and columns
      KanbanColumn.tsx     - Individual column component
      TaskCard.tsx         - Task card component
      TaskDetailDialog.tsx - Task detail modal
      SettingsDialog.tsx   - Settings modal
      ProjectChatSheet.tsx - Project Chat side panel with task threads
    ui/              - shadcn/ui components
  hooks/
    useKanban.ts   - Kanban state management (localStorage)
    useChat.ts     - Chat messages state management (localStorage)
    useTheme.ts    - Dark/light theme toggle
    useSettings.ts - Team members and projects settings
  lib/             - Utility functions
  types/
    kanban.ts      - Task, ChatMessage, and related type definitions
```

## Development

The app runs on port 5000 via `npm run dev`. The workflow "Start application" handles this.

## Key Configuration

- `vite.config.ts` - Configured for Replit: host `0.0.0.0`, port `5000`, `allowedHosts: true`
- `tailwind.config.ts` - Custom theme configuration
- `components.json` - shadcn/ui component configuration
