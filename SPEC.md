# Project Tracker — Implementation & Design Specification

This document is a complete specification for rebuilding the Project Tracker application from scratch. It is written for an LLM or developer who needs to reproduce the app faithfully.

---

## 1. Overview

A single-page Kanban board for tracking project tasks. The app runs entirely in the browser with all data persisted to `localStorage` (no backend). It features three status columns, a per-task chat system, rich task detail editing, configurable team/project lists, dark mode, and mobile-optimized keyboard handling. The UI is polished with spring-based entrance animations, hover micro-interactions, and a "Blocked" task status with an animated red glow.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build tool | Vite (with SWC plugin) | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI primitives | shadcn/ui (Radix UI) | latest |
| Icons | lucide-react | 0.462+ |
| Date formatting | date-fns | 3.x |
| Routing | react-router-dom | 6.x |
| State queries | @tanstack/react-query | 5.x (used for provider, not for data fetching since all data is local) |
| Animation plugin | tailwindcss-animate | 1.x |
| Font | DM Sans (Google Fonts) | - |

### Key Dependencies Not Used for Core Logic
`react-hook-form`, `zod`, `recharts`, `sonner`, `vaul`, `embla-carousel-react` are installed but not used by the core Kanban features. They exist for the project template and can be ignored for reimplementation.

---

## 3. Data Model

All types are defined in a single file: `src/types/kanban.ts`.

### 3.1 Types

```typescript
type ColumnId = "todo" | "in-progress" | "done";

interface Comment {
  id: string;          // Date.now().toString()
  text: string;
  author: string;      // Always "You" for user-created comments
  createdAt: Date;
}

interface Attachment {
  id: string;          // Date.now().toString()
  name: string;
  url: string;         // Currently always "#" (placeholder)
  createdAt: Date;
}

interface Task {
  id: string;          // Date.now().toString()
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

interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

interface ChatMessage {
  id: string;          // Date.now().toString()
  taskId: string;      // Links to Task.id
  text: string;
  author: string;      // Always "You"
  createdAt: Date;
}
```

### 3.2 Constants

```typescript
const DEFAULT_TEAM_MEMBERS = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey"];
const DEFAULT_PROJECTS = ["Website Redesign", "Mobile App", "API Platform", "Marketing", "Infrastructure"];
```

### 3.3 localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `kanban-tasks` | `Task[]` (JSON) | All tasks across all columns |
| `kanban-chat-messages` | `ChatMessage[]` (JSON) | All chat messages for all tasks |
| `kanban-team-members` | `string[]` (JSON) | Team member names |
| `kanban-projects` | `string[]` (JSON) | Project names |
| `theme` | `"dark"` or `"light"` | Theme preference |

### 3.4 Seed Data

On first load (empty localStorage), create these tasks with **fixed string IDs** (not `Date.now()`):

| ID | Title | Description | Priority | Column | Assignee | Project |
|----|-------|------------|----------|--------|----------|---------|
| "1" | Design homepage layout | Create wireframes and mockups | high | todo | Alex | Website Redesign |
| "2" | Set up project repo | (none) | medium | todo | Jordan | API Platform |
| "3" | API integration | Connect to backend services | high | in-progress | Sam | API Platform |
| "4" | Write unit tests | (none) | low | in-progress | Taylor | Mobile App |
| "5" | Initial research | Market analysis complete | medium | done | Morgan | Marketing |

Note: Only seed tasks use fixed IDs. All user-created tasks, comments, attachments, and chat messages use `Date.now().toString()` for their IDs.

---

## 4. Architecture

### 4.1 File Structure

```
src/
  main.tsx                              # Entry point + global keyboard handler
  App.tsx                               # Router + providers
  index.css                             # Tailwind directives, CSS variables, custom utilities
  types/
    kanban.ts                           # All data types and constants
  hooks/
    useKanban.ts                        # Task CRUD + localStorage persistence
    useChat.ts                          # Chat message CRUD + localStorage persistence
    useSettings.ts                      # Team members + projects management
    useTheme.ts                         # Dark mode toggle with localStorage + system preference
    useKeyboardOffset.ts                # Mobile keyboard detection (3 hooks)
  components/
    kanban/
      KanbanBoard.tsx                   # Top-level board layout, header, orchestrates all state
      KanbanColumn.tsx                  # Single column: header, task list, add-task card
      TaskCard.tsx                      # Individual task card with swipe, move, delete
      TaskDetailDialog.tsx              # Full task edit dialog with collapsible sections
      ProjectChatSheet.tsx              # Side panel chat with task list + message thread views
      SettingsDialog.tsx                # Team member and project list management
    ui/
      (shadcn components)               # dialog, sheet, input, textarea, scroll-area, etc.
  pages/
    Index.tsx                           # Renders <KanbanBoard />
    NotFound.tsx                        # 404 page
```

### 4.2 Component Hierarchy

```
App
  └─ BrowserRouter
       └─ Routes
            └─ Index
                 └─ KanbanBoard
                      ├─ KanbanColumn (x3: todo, in-progress, done)
                      │    └─ TaskCard (per task)
                      ├─ TaskDetailDialog
                      ├─ SettingsDialog
                      └─ ProjectChatSheet
```

### 4.3 State Management

All state is managed with React `useState` hooks inside custom hooks. There is no global state store; state is lifted to `KanbanBoard` and passed down as props.

| Hook | State | Persistence |
|------|-------|------------|
| `useKanban()` | `tasks: Task[]` | `localStorage("kanban-tasks")` |
| `useChat()` | `messages: ChatMessage[]` | `localStorage("kanban-chat-messages")` |
| `useSettings()` | `teamMembers: string[]`, `projects: string[]` | Two localStorage keys |
| `useTheme()` | `dark: boolean` | `localStorage("theme")` + `prefers-color-scheme` fallback |

---

## 5. Hook Specifications

### 5.1 `useKanban()`

Returns: `{ tasks, addTask, moveTask, deleteTask, updateTask, addComment, addAttachment, removeAttachment, getTasksByColumn }`

- **`addTask(title, columnId, priority?, description?)`**: Creates task with `Date.now()` ID, default priority `"medium"`.
- **`moveTask(taskId, toColumn)`**: Updates the task's `columnId`.
- **`deleteTask(taskId)`**: Removes task from array.
- **`updateTask(taskId, updates: Partial<Task>)`**: Merges partial updates.
- **`addComment(taskId, text)`**: Appends a `Comment` with author `"You"`.
- **`addAttachment(taskId, name, url)`**: Appends an `Attachment`.
- **`removeAttachment(taskId, attachmentId)`**: Filters out the attachment.
- **`getTasksByColumn(columnId)`**: Returns filtered array.

All mutations call `saveTasks()` which writes to localStorage immediately.

When loading from localStorage, deserialize `createdAt` back to `Date` objects and default missing `comments`/`attachments` to `[]`.

### 5.2 `useChat()`

Returns: `{ messages, addMessage, getMessagesByTask, getLastMessage }`

- **`addMessage(taskId, text, author?)`**: Creates message with `Date.now()` ID, default author `"You"`.
- **`getMessagesByTask(taskId)`**: Filters messages by taskId.
- **`getLastMessage(taskId)`**: Returns the most recent message for a task, or `null`.

### 5.3 `useSettings()`

Returns: `{ teamMembers, projects, updateTeamMembers, updateProjects }`

Loads from localStorage with fallback to `DEFAULT_TEAM_MEMBERS` and `DEFAULT_PROJECTS`.

### 5.4 `useTheme()`

Returns: `{ dark: boolean, toggle: () => void }`

- On init: checks `localStorage("theme")`, falls back to `window.matchMedia("(prefers-color-scheme: dark)")`.
- On change: toggles `.dark` class on `document.documentElement`, saves to localStorage.

### 5.5 Keyboard Hooks (`useKeyboardOffset.ts`)

Three exported hooks:

1. **`useKeyboardOffset()`**: Uses `window.visualViewport` resize/scroll events. Returns pixel height of keyboard (0 when closed). Uses 50px threshold to filter out browser chrome changes.

2. **`useMobileInputFocused()`**: Tracks whether an INPUT/TEXTAREA/SELECT is focused on mobile (< 640px width). Uses `focusin`/`focusout` document events.

3. **`useEffectiveKeyboardHeight()`**: Combines the above two. If `visualViewport` reports a height > 0, use it. Otherwise, if an input is focused on mobile, return `300` (estimated keyboard height). Otherwise return `0`. This fallback handles iframe/webview contexts where `visualViewport` doesn't work.

---

## 6. Component Specifications

### 6.1 KanbanBoard

The root component. Renders:
- **Header**: App icon (Layout), title "Project Tracker", total task count, Project Chat button, Settings button (gear icon with 90deg rotation on hover), theme toggle (Sun/Moon icon with scale-in animation).
- **Main area**: Horizontal scroll container with 3 `KanbanColumn` instances.
- **Dialogs/Sheets**: `TaskDetailDialog`, `SettingsDialog`, `ProjectChatSheet` — all controlled by boolean state.

Layout: Full viewport height (`h-[100dvh]`), flex column. Header is fixed/shrink-0 with backdrop blur. Main area is `overflow-x-auto` with `snap-x snap-mandatory` on mobile, no snap on desktop (`md:snap-none`).

State: `selectedTask`, `dialogOpen`, `settingsOpen`, `chatOpen`. `liveTask` is derived by finding the selected task in the current tasks array (so edits reflect in real time).

### 6.2 KanbanColumn

Props: `id, title, tasks, count, onMove, onDelete, onAdd, onOpenTask`

Layout:
- Mobile: Full viewport width (`w-[100vw]`), snap-center for horizontal scrolling between columns.
- Desktop: `md:w-80 md:flex-1`.

Parts:
- **Column header**: Colored background using kanban color tokens. Colored dot, title, task count.
- **Task list**: Vertical stack of `TaskCard` components with 2.5 gap.
- **Add task button/card**: Toggles between a "Add task" button (with Plus icon that rotates 90deg on hover) and an inline form card.

**Add task form**:
- Text input for title (no `autoFocus` — important for mobile keyboard UX).
- Three priority buttons (low/medium/high) with staggered scale-in animations.
- Submit ("Add Task") and Cancel buttons with fade-in animation.
- On render: scrolls the card into view after 100ms (`block: "center"`).
- On input focus: scrolls again after 400ms (`block: "start"`) to clear keyboard overlap.
- Submit on Enter key or button click.

### 6.3 TaskCard

Props: `task, onMove, onDelete, onOpen`

Visual design:
- Rounded card with shadow, border. Click opens task detail.
- Shows: title, description (if present), assignee (with User icon), project (with FolderOpen icon), priority badge, blocked badge.
- **Blocked state**: Red border (`border-red-400/70`) + `animate-blocked-pulse` (infinite red glow animation).
- **In-progress state** (not blocked): `animate-pulse-subtle` (subtle amber/progress-color glow).

Interactions:
- **Hover**: Lift up 1px (`hover:translate-y-[-1px]`) + shadow increase.
- **Active**: Scale down (`active:scale-[0.97]`).
- **Move button** (forward): Appears for todo/in-progress. Shows "Move" with ChevronRight that bounces right on hover.
- **Reopen button** (backward): Appears for in-progress/done. Shows "Reopen" with ChevronLeft that bounces left on hover.
- **Delete button**: Trash icon that shakes on hover. Stops event propagation.
- **Touch swipe**: Horizontal swipe gesture. Clamped to +/-80px. >60px right = move forward, <-60px left = move backward.

Movement mapping:
```
Forward:  todo → in-progress → done → (none)
Backward: (none) ← todo ← in-progress ← done
```

### 6.4 TaskDetailDialog

Props: `task, open, onOpenChange, onUpdate, onAddComment, onAddAttachment, onRemoveAttachment, onDelete, onMove, teamMembers, projects`

Uses shadcn `Dialog` component. Max width `max-w-lg`.

**Keyboard-aware sizing**: `maxHeight` is dynamically calculated:
- Keyboard open: `calc(100dvh - ${kbHeight}px - 2rem)`
- Keyboard closed: `85dvh`

**Scroll-into-view on focus**: `onFocusCapture` handler on scroll area. When an INPUT/TEXTAREA gains focus, after 350ms delay, calls `scrollIntoView({ behavior: "smooth", block: "center" })`.

Content sections (top to bottom):

1. **Header**: Editable title input, priority toggle buttons, Blocked toggle button (right-aligned, red when active).

2. **CollapsibleSection: Description**: Textarea for description. Auto-collapses on mobile, auto-expands on desktop. Responds to media query changes. Resets open state when task changes.

3. **CollapsibleSection: Assigned to**: Grid of team member pill buttons. Click to assign/unassign (toggle behavior).

4. **CollapsibleSection: Project**: Grid of project pill buttons. Same toggle behavior.

5. **CollapsibleSection: Attachments**: List of existing attachments with remove (X) buttons. Input + "Add" button for new attachments (name-only, URL is always `"#"`).

6. **Comments section** (not collapsible): Scrollable list of comments. Input + Send button. Enter key submits.

7. **Reopen button**: Only shown if task can move backward. Includes animated RotateCcw icon (-180deg on hover). Shows target column name.

8. **Delete button**: Red text, Trash icon shakes on hover. Closes dialog after deletion.

**CollapsibleSection** is a reusable sub-component with:
- Icon, label, summary text (shown when collapsed), chevron indicator.
- `resetKey` prop (task ID + open state) triggers re-evaluation of initial open state.
- Desktop (>= 640px): starts open. Mobile: starts closed.
- Listens for media query changes to adjust.

### 6.5 ProjectChatSheet

Props: `open, onOpenChange, tasks`

Uses shadcn `Sheet` (side="right", full width on mobile, max-w-md on desktop). Has two views:

**Task List View** (no active task):
- Header: "Project Chat" title with description.
- Scrollable list of all tasks, sorted by most recent message (tasks with messages first, then by message date descending).
- Each task row shows: status icon (Circle/Clock/CheckCircle2 with column-specific color), title, message count badge, column label, assignee, last message preview.

**Chat Thread View** (active task selected):
- Header: Back button (ArrowLeft with hover translate), task title, column/assignee/project info.
- Message area: Scrollable div. Messages from "You" align right (primary color, rounded-br-md). Other messages align left (secondary color, rounded-bl-md). Each has author name (non-You only), text, timestamp formatted as "MMM d, h:mm a" using date-fns.
- Empty state: MessageSquare icon + "No messages yet" text.
- Input area: Text input + Send button. Enter sends (no shift+Enter for newline). Send button disabled when input is empty.
- **Keyboard offset**: Bottom padding increases by `kbHeight + 12px` when keyboard is open.

Auto-scroll: When message count changes, scroll container scrolls to bottom. When task is selected, input auto-focuses.

Resets `activeTaskId` and `input` when sheet closes.

### 6.6 SettingsDialog

Props: `open, onOpenChange, teamMembers, projects, onUpdateTeamMembers, onUpdateProjects`

Simple dialog with two sections:
1. **Team Members**: Shows existing as removable pills. Input + Plus button to add. Enter key submits. Prevents duplicates.
2. **Projects**: Same pattern.

---

## 7. Styling System

### 7.1 Color Tokens (CSS Variables)

All colors use HSL format without `hsl()` wrapper: `H S% L%`. They are referenced via Tailwind as `hsl(var(--name))`.

**Light mode (:root)**:
```css
--background: 0 0% 97%;        /* near-white */
--foreground: 225 25% 12%;      /* dark blue-gray */
--card: 0 0% 100%;              /* white */
--primary: 350 80% 58%;         /* rose/coral */
--primary-foreground: 0 0% 100%;
--secondary: 225 20% 94%;       /* light blue-gray */
--muted: 220 14% 92%;
--muted-foreground: 220 10% 46%;
--accent: 350 80% 95%;          /* light rose */
--accent-foreground: 350 80% 42%;
--destructive: 0 84% 60%;       /* red */
--border: 220 13% 89%;
--ring: 350 80% 58%;            /* matches primary */
--radius: 0.75rem;

/* Kanban column colors */
--kanban-todo: 220 14% 96%;           /* light blue-gray */
--kanban-todo-accent: 220 14% 70%;
--kanban-progress: 38 92% 95%;        /* light amber */
--kanban-progress-accent: 38 92% 50%;
--kanban-done: 152 60% 94%;           /* light green */
--kanban-done-accent: 152 60% 40%;
```

**Dark mode (.dark)**:
```css
--background: 225 25% 8%;
--foreground: 0 0% 95%;
--card: 225 20% 12%;
--primary: 350 80% 58%;         /* same hue, same lightness */
--secondary: 225 20% 18%;
--muted: 225 15% 18%;
--muted-foreground: 220 10% 55%;
--accent: 350 50% 20%;
--accent-foreground: 350 80% 70%;
--destructive: 0 62.8% 30.6%;
--border: 225 15% 20%;

--kanban-todo: 220 14% 16%;
--kanban-todo-accent: 220 14% 55%;
--kanban-progress: 38 40% 16%;
--kanban-progress-accent: 38 80% 55%;
--kanban-done: 152 30% 14%;
--kanban-done-accent: 152 50% 50%;
```

### 7.2 Font

DM Sans imported from Google Fonts. Set as `font-family` on body and in Tailwind `fontFamily.sans` config.

### 7.3 Mobile Input Zoom Prevention

On screens < 640px, force `font-size: 16px !important` on all inputs/textareas/selects to prevent iOS zoom.

### 7.4 Utility Classes

```css
.touch-action-pan-y    { touch-action: pan-y; }
.touch-action-none     { touch-action: none; }
.scrollbar-hide        { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.stagger-1 through .stagger-5  { animation-delay: 0.05s to 0.25s }
.anim-fill-both        { animation-fill-mode: both; }
```

---

## 8. Animation System

### 8.1 Keyframes (defined in Tailwind config)

| Name | Description | Duration/Easing |
|------|-------------|----------------|
| `slide-up` | Fade + translateY(12px) + scale(0.97) to normal | 0.35s cubic-bezier(0.16,1,0.3,1) |
| `slide-down` | Fade + translateY(-8px) to normal | 0.3s cubic-bezier(0.16,1,0.3,1) |
| `fade-in` | Opacity 0 to 1 | 0.25s ease-out |
| `scale-in` | Opacity 0 + scale(0.9) to normal | 0.25s cubic-bezier(0.16,1,0.3,1) |
| `pop-in` | Scale 0.8 → 1.05 → 1 (spring overshoot) | 0.35s cubic-bezier(0.34,1.56,0.64,1) |
| `blocked-pulse` | Red box-shadow oscillating (0.25 → 0.35 opacity) | 2s ease-in-out infinite |
| `bounce-right` | translateX 0 → 3px → 0 | 0.4s ease-in-out |
| `bounce-left` | translateX 0 → -3px → 0 | 0.4s ease-in-out |
| `shake` | translateX + rotate oscillation (-2px/-1deg → 2px/1deg) | 0.3s ease-in-out |

### 8.2 CSS Keyframe (defined in index.css)

| Name | Description | Duration/Easing |
|------|-------------|----------------|
| `pulse-subtle` | Box-shadow + border-color oscillation using `--kanban-progress-accent` | 2.5s cubic-bezier(0.4,0,0.6,1) infinite |

### 8.3 Animation Usage Map

| Element | Animation | Trigger |
|---------|-----------|---------|
| Task cards | `animate-slide-up anim-fill-both` | On render (entrance) |
| Task cards (in-progress, not blocked) | `animate-pulse-subtle` | Continuous |
| Task cards (blocked) | `animate-blocked-pulse` | Continuous |
| Task cards | `hover:translate-y-[-1px] hover:shadow-md` | Hover |
| Task cards | `active:scale-[0.97]` | Press |
| Column header | `animate-fade-in` | On render |
| Column status dot | `animate-pop-in` | On render |
| Column task count | `animate-scale-in` | On render |
| App header | `animate-slide-down` | On render |
| App icon | `animate-pop-in` | On render |
| Theme toggle icon | `animate-scale-in` | On theme change |
| Settings gear icon | `group-hover/settings:rotate-90` | Hover on button |
| Add task Plus icon | `group-hover/add:rotate-90` | Hover on button |
| Move ChevronRight | `group-hover/fwd:animate-bounce-right` | Hover |
| Reopen ChevronLeft | `group-hover/back:animate-bounce-left` | Hover |
| Delete Trash icon | `group-hover/del:animate-shake` | Hover |
| Blocked badge | `animate-pop-in` | On render |
| Priority buttons (add form) | `animate-scale-in anim-fill-both stagger-N` | On render (staggered) |
| Add form buttons | `animate-fade-in anim-fill-both stagger-3` | On render |
| Chat messages | `animate-slide-up anim-fill-both` | On render |
| Reopen button RotateCcw | `group-hover/reopen:-rotate-180` (300ms) | Hover |

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. Mobile Keyboard Handling

### 9.1 Entry Point (`main.tsx`)

Before React mounts:
1. If `navigator.virtualKeyboard` exists, set `overlaysContent = false`.
2. Register a global `focusin` handler that scrolls focused INPUT/TEXTAREA/SELECT elements into view after 350ms — but **skips** elements inside `[role='dialog']` or `[data-radix-popper-content-wrapper]` (dialogs handle their own scroll), and skips the element with `data-testid="input-new-task-title"` (KanbanColumn handles its own scroll).

### 9.2 TaskDetailDialog Keyboard Adaptation

- Dialog `maxHeight` shrinks when keyboard is detected.
- `onFocusCapture` on scroll container scrolls the focused input into view after 350ms.

### 9.3 ProjectChatSheet Keyboard Adaptation

- Input container gets extra `paddingBottom` equal to `kbHeight + 12px` when keyboard is open.

### 9.4 KanbanColumn Add-Task Keyboard Adaptation

- Card scrolls into view on render (100ms, `block: "center"`).
- Input focus triggers a second scroll (400ms, `block: "start"`) to push the card above the keyboard.

---

## 10. Responsive Design

### Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (< 768px / `md`) | Columns are full viewport width, horizontally scrollable with snap. Columns have no gap/padding. CollapsibleSections in TaskDetail start collapsed. |
| Desktop (>= 768px / `md`) | Columns are `w-80 flex-1` in a flex row with gaps. CollapsibleSections start expanded. |
| Small mobile (< 640px / `sm`) | "Project Chat" label text hidden (icon only). Input font-size forced to 16px. |

### Touch Interactions

- Task cards support horizontal swipe to move between columns (60px threshold).
- All interactive elements have minimum touch targets (44px height where applicable).
- `-webkit-tap-highlight-color: transparent` set globally.

---

## 11. Routing

Simple two-route setup with `react-router-dom`:
- `/` → `Index` page (renders `KanbanBoard`)
- `*` → `NotFound` page

---

## 12. data-testid Conventions

All interactive and meaningful elements have `data-testid` attributes:

| Pattern | Example |
|---------|---------|
| `card-task-${id}` | Task card |
| `button-delete-${id}` | Delete button on card |
| `button-move-${id}` | Move forward button |
| `button-reopen-${id}` | Move backward button |
| `badge-blocked-${id}` | Blocked badge |
| `button-add-task-${columnId}` | Add task button per column |
| `input-new-task-title` | New task title input |
| `button-new-priority-${priority}` | Priority selector in add form |
| `button-submit-task` | Submit new task |
| `button-cancel-add` | Cancel add task |
| `button-project-chat` | Open chat sheet |
| `button-settings` | Open settings |
| `button-toggle-theme` | Theme toggle |
| `task-detail-dialog` | Task detail dialog |
| `input-task-title` | Title input in detail |
| `input-task-description` | Description textarea |
| `button-priority-${p}` | Priority in detail |
| `button-toggle-blocked` | Blocked toggle |
| `toggle-${section}` | CollapsibleSection toggle |
| `button-assignee-${name}` | Assignee pill |
| `button-project-${name}` | Project pill |
| `input-comment` | Comment input |
| `button-send-comment` | Send comment |
| `input-attachment-name` | Attachment name input |
| `button-add-attachment` | Add attachment |
| `comment-${id}` | Comment display |
| `attachment-${id}` | Attachment display |
| `button-reopen-task` | Reopen in detail |
| `button-delete-task` | Delete in detail |
| `project-chat-sheet` | Chat sheet |
| `chat-task-${id}` | Task in chat list |
| `chat-back-button` | Back button in chat |
| `chat-messages-area` | Messages scroll area |
| `chat-message-${id}` | Individual message |
| `chat-input` | Chat text input |
| `chat-send-button` | Chat send button |

---

## 13. Build & Dev Configuration

### Vite Config
- Server: host `0.0.0.0`, port `5000`, HMR overlay disabled.
- Plugin: `@vitejs/plugin-react-swc`.
- Alias: `@` maps to `./src`.

### Tailwind Config
- `darkMode: ["class"]`
- Content paths: `./pages/**`, `./components/**`, `./app/**`, `./src/**` (all `.ts`/`.tsx`).
- Container: centered, 1rem padding, max 1400px.
- Plugins: `tailwindcss-animate`.

### PostCSS
- Plugins: `tailwindcss`, `autoprefixer`.

---

## 14. Implementation Order (Recommended)

For an LLM or developer rebuilding this from scratch:

1. **Project scaffolding**: Vite + React + TypeScript + Tailwind + shadcn/ui setup.
2. **Types**: Define all interfaces and constants in `src/types/kanban.ts`.
3. **CSS**: Set up `index.css` with all CSS variables (light + dark), utilities, and the `pulse-subtle` keyframe. Set up `tailwind.config.ts` with all keyframes, animations, and color mappings.
4. **Hooks**: Implement `useKanban`, `useChat`, `useSettings`, `useTheme`, `useKeyboardOffset` (all three hooks).
5. **TaskCard**: Build the card component with priority badges, blocked state, swipe gestures, and all animations.
6. **KanbanColumn**: Build the column with header, task list, and add-task form with keyboard-aware scrolling.
7. **KanbanBoard**: Assemble the header, columns, and wire up state.
8. **TaskDetailDialog**: Build with collapsible sections, keyboard offset, all CRUD operations.
9. **ProjectChatSheet**: Build with two-view navigation, message threading, keyboard offset.
10. **SettingsDialog**: Build team/project management.
11. **main.tsx**: Add global keyboard focus handler.
12. **Testing**: Verify all interactions, animations, dark mode, mobile keyboard behavior.

---

## 15. Critical Implementation Details

1. **No autoFocus on add-task input**: This prevents the mobile keyboard from immediately appearing when the add card opens, which would cause scroll conflicts.

2. **Staggered scroll-into-view**: The add-task card uses two separate scroll calls (100ms on mount, 400ms on focus) because the keyboard animation takes time to complete.

3. **Global focusin handler exclusions**: The handler in `main.tsx` must skip dialogs (which have their own scroll logic) and the add-task input (which has its own scroll logic) to prevent double-scrolling conflicts.

4. **Live task updates**: In `KanbanBoard`, `liveTask` is derived from the current tasks array using `tasks.find()`, not from stale `selectedTask` state. This ensures the dialog always shows current data.

5. **Blocked vs In-Progress animations**: These are mutually exclusive. A blocked task gets the red pulse, while a non-blocked in-progress task gets the subtle amber pulse. Both use infinite animations.

6. **Date serialization**: When loading from localStorage, all `createdAt` fields must be deserialized from strings back to `Date` objects.

7. **CollapsibleSection reset**: Uses a `resetKey` prop (combination of task ID and dialog open state) to re-evaluate whether sections should start open or closed when a different task is selected.

8. **Chat sort order**: Tasks are sorted by most recent message timestamp (descending), with tasks that have messages appearing before those without.
