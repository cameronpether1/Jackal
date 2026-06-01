# Jackal — Claude Code Project Prompt

## Project Overview

Build **Jackal**, a real-time collaborative whiteboard web app where users can create shared "boards" and post notes, task lists, and questions that all board members can see. Think of it as a persistent family/team shared pinboard — like a physical corkboard but digital, live, and collaborative.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Backend/Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email + magic link)
- **Real-time:** Supabase Realtime (channel subscriptions)
- **File Storage:** Supabase Storage (profile avatars)
- **Fonts:** Geist (body) + Geist Mono (monospace) via `next/font`
- **Icons:** Lucide React

---

## Design System

Use the following CSS custom properties throughout (via Tailwind `@theme` or a globals.css file):

### Colours (Light / Dark)
```css
/* Light */
--color-bg: #f4f3f0;
--color-surface: #ffffff;
--color-surface-offset: #f0ede8;
--color-border: rgba(0,0,0,0.08);
--color-text: #1a1917;
--color-text-muted: #6b6a67;
--color-text-faint: #b0afa9;
--color-accent: #f97316; /* orange — buttons, active states */

/* Dark */
--color-bg: #111110;
--color-surface: #1c1b19;
--color-surface-offset: #272523;
--color-border: rgba(255,255,255,0.08);
--color-text: #e8e6e1;
--color-text-muted: #7a7874;
--color-accent: #fb923c;
```

### Typography
- Body font: `Geist`, fallback `Inter, sans-serif`
- Mono font: `Geist Mono`
- Scale: xs (12px) → sm (14px) → base (16px) → lg (20px) → xl (26px)
- Max heading size in app UI: `text-xl` — this is a web app, not a landing page

### Radii & Shadows
- Cards: `rounded-xl` with `shadow-[0_2px_8px_rgba(0,0,0,0.08)]`
- Modals: `rounded-2xl` with `shadow-2xl`
- Buttons: `rounded-lg`
- Avatars: `rounded-full`

### Aesthetic
- Warm off-white surfaces (not pure white), dot-grid canvas background
- Cards have a subtle 1–3° random rotation for a "pinned to board" feel
- Author avatar badge pinned to the top-right corner of each card
- Orange (`#f97316`) as the single accent colour for CTAs and active states
- Support both light and dark mode via `data-theme` on `<html>` + `next-themes`

---

## Database Schema

```sql
-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Boards
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Board Members
create table public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(board_id, user_id)
);

-- Posts (cards on the board)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('note', 'tasks', 'question')),
  title text,
  content text,
  pos_x float default 100,
  pos_y float default 100,
  rotation float default 0, -- degrees, e.g. -2 to 2
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Task Items (children of posts with type='tasks')
create table public.task_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  label text not null,
  checked boolean default false,
  position integer default 0,
  created_at timestamptz default now()
);

-- Reactions (emoji reactions on posts)
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(post_id, user_id, emoji)
);

-- Board Invites
create table public.board_invites (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  invited_email text not null,
  invited_by uuid references public.profiles(id),
  token text unique default encode(gen_random_bytes(32), 'hex'),
  accepted boolean default false,
  created_at timestamptz default now()
);
```

Enable **Row Level Security** on all tables. Key policies:
- `profiles`: readable by authenticated users, writable only by the owner
- `boards`: readable/writable only by board members
- `posts`: readable/writable only by board members
- `board_members`: readable by board members, insertable by board owner

---

## App Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx          # Email + magic link login
│   └── callback/route.ts       # Supabase auth callback
├── (app)/
│   ├── layout.tsx              # App shell: sidebar + topbar
│   ├── board/[boardId]/
│   │   └── page.tsx            # Main whiteboard view
│   └── invite/[token]/
│       └── page.tsx            # Accept board invite
├── api/
│   └── invite/route.ts         # Send invite email (Supabase Edge Function or Route Handler)
└── page.tsx                    # Redirect to first board or login

components/
├── board/
│   ├── Whiteboard.tsx          # Canvas container with dot-grid background
│   ├── PostCard.tsx            # Individual draggable card
│   ├── CardAuthorBadge.tsx     # Avatar + name pill pinned to card corner
│   ├── TaskList.tsx            # Checklist sub-component
│   └── ReactionRow.tsx         # Emoji reaction pills
├── compose/
│   ├── ComposeModal.tsx        # shadcn Dialog for new post
│   └── PostTypeSelector.tsx    # Note / Tasks / Question chips
├── sidebar/
│   ├── Sidebar.tsx             # Board list + nav
│   └── BoardItem.tsx
├── topbar/
│   ├── Topbar.tsx
│   ├── MemberAvatarStack.tsx
│   └── InvitePanel.tsx         # shadcn Sheet for member management
└── ui/                         # shadcn primitives (auto-generated)
```

---

## Feature Specification

### 1. Authentication
- Email/password signup + magic link login
- On first login, prompt for `display_name` and optional avatar upload
- Persist session via Supabase SSR client (`@supabase/ssr`)

### 2. Boards
- Users can create multiple boards (e.g. "Family Board", "Work Projects")
- Each board has a name, an owner, and a list of members
- Active board is shown in the topbar center with member count badge
- Sidebar lists all boards the current user belongs to, with coloured dot indicator and member avatar stack

### 3. Whiteboard Canvas
- Full-viewport canvas area with a dot-grid background (`radial-gradient` CSS pattern)
- Cards are positioned absolutely with `left`/`top` CSS from the database `pos_x`/`pos_y` values
- Cards can be **dragged** by any board member — debounce the `mouseup` event and PATCH the new position to Supabase
- Each card has a random `rotation` (−2° to +2°) assigned at creation time, stored in the DB
- On hover, cards lift slightly (`translateY(-2px)`) and lose their rotation (`rotate(0deg)`)

### 4. Post Cards

#### All cards share:
- White surface (`--color-surface`), `rounded-xl`, subtle `box-shadow`
- **Author badge** — positioned `absolute top-[-14px] right-4`, contains the author's avatar (circular, 20px) + display name, pill-shaped with the author's accent colour as background
- Card width: `260px` fixed
- Action row at the bottom: Like button + Reply button (separated by a `border-t`)

#### Note card
- Optional `title` (bold, `text-sm font-semibold`)
- `content` body text (`text-sm text-muted`)
- Reaction row (emoji pills, see below)

#### Task card
- Optional `title`
- List of `task_items` rendered as checkboxes
- Each checkbox toggles `checked` state in the DB in real-time
- "Add task" inline button at the bottom to append a new task item
- Task items with `checked=true` get `line-through` styling

#### Question card
- Pink `"Question"` tag badge above the title
- Otherwise same as Note card

### 5. Reactions
- Each post can have emoji reactions (`👋`, `❤️`, `😂`, `🎉`, `🤷`, etc.)
- Reaction pills show emoji + count, displayed below the card content
- Clicking a reaction you haven't added → inserts a row into `reactions`
- Clicking a reaction you have added → deletes your row (toggle)
- Counts update in real-time via Supabase Realtime

### 6. Real-time Collaboration
Use Supabase Realtime to subscribe to changes on the active board:
```ts
supabase
  .channel(`board:${boardId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `board_id=eq.${boardId}` }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'task_items' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, handler)
  .subscribe()
```
- New posts appear on other members' boards without a page refresh
- Task check/uncheck syncs live
- Reactions update live

### 7. Compose Modal (New Post)
- Triggered by "New Post" button in floating toolbar OR keyboard shortcut `N`
- `shadcn/ui Dialog`
- Post type selector: Note / Tasks / Question (pill-shaped chip buttons)
- Fields shown depending on type:
  - Note & Question: Title (optional) + Content textarea
  - Tasks: Title (optional) + multi-line textarea (one task per line, split on submit)
- Footer: "Posting as [Avatar] [Name]" on the left, Cancel + Post buttons on the right
- On submit: insert into `posts` (and `task_items` if type=tasks), card appears on the board

### 8. Floating Toolbar
Fixed to `bottom: 24px, left: 50%` (translateX -50%), contains:
- Select tool button (active by default)
- Pan tool button
- Separator
- Note shortcut button
- Task list shortcut button
- Separator
- "New Post" primary orange button

### 9. Invite System
- "Invite" button in topbar opens a `shadcn/ui Sheet` panel on the right
- Lists current members with avatar, name, online status (presence via Supabase Realtime), and role badge
- Email input + Send button → creates a `board_invites` row and sends an email with the invite link
- `/invite/[token]` page: verifies the token, adds the user to `board_members`, redirects to the board

### 10. Zoom Controls
- Bottom-right corner: `−` / `100%` / `+` buttons
- Scales the whiteboard container via CSS `transform: scale()`
- Range: 50% – 200%

---

## Component: PostCard

```tsx
// Key props
interface PostCardProps {
  post: Post & { author: Profile; task_items?: TaskItem[]; reactions?: Reaction[] }
  currentUserId: string
  onDragEnd: (postId: string, x: number, y: number) => void
  onTaskToggle: (taskId: string, checked: boolean) => void
  onReactionToggle: (postId: string, emoji: string) => void
}
```

Use `useDraggable` from `@dnd-kit/core` or a custom `usePointerDrag` hook for dragging.

---

## Supabase Client Setup

Use `@supabase/ssr` for both server and client:

```ts
// lib/supabase/server.ts — for Server Components and Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr'
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # for invite email sending only
NEXT_PUBLIC_APP_URL=             # for invite link generation
```

---

## Key UX Details to Implement

1. **Card author colour coding** — each user gets a consistent accent colour (derived from their user ID, cycle through: orange, pink, blue, green, purple). Store as `avatar_color` on the `profiles` table.
2. **Skeleton loaders** — show card-shaped skeletons while initial board data loads (shimmer animation)
3. **Empty state** — when a board has no posts, show a centred hint with a dashed border box, an arrow pointing to the "New Post" button, and the copy "Add your first post to the board — press N"
4. **Optimistic updates** — when adding a post or toggling a task, update local state immediately before the Supabase response comes back
5. **Toast notifications** — use `shadcn/ui` Sonner for: "Post added ✓", "Invite sent to [email] ✓", copy/delete confirmations
6. **Keyboard shortcuts:**
   - `N` → open compose modal
   - `Escape` → close any open modal/panel
   - `Cmd/Ctrl + K` → future: command palette
7. **Presence indicators** — green dot on avatars of members currently viewing the same board (Supabase Realtime Presence)
8. **Right-click context menu** on cards — "Edit", "Delete", "Copy link" (shadcn ContextMenu)
9. **Dark mode** — via `next-themes`, toggle button in topbar, respects `prefers-color-scheme` on first load

---

## Suggested Build Order

1. Supabase project setup — schema, RLS policies, auth config
2. Next.js project scaffold — `create-next-app`, install shadcn, configure Tailwind theme
3. Auth flow — login page, magic link callback, profile creation
4. Board creation + sidebar listing
5. Whiteboard canvas + static card rendering from DB
6. Dragging cards + persisting position
7. Compose modal + post creation (Note, Tasks, Question types)
8. Task item toggle
9. Reactions
10. Real-time subscriptions (posts, tasks, reactions)
11. Invite panel + invite flow
12. Presence (online indicators)
13. Polish — skeletons, empty states, dark mode, toasts, context menus

---

## Reference UI

The visual design should closely match this prototype aesthetic:
- Warm off-white dot-grid canvas
- White floating cards with rounded corners and soft shadows
- Author name+avatar pill pinned to the top-right of each card
- Orange accent for the primary "New Post" CTA
- Clean sans-serif (Geist) throughout
- Sidebar: dark/neutral background listing boards and nav items
- Topbar: white, member avatar stack, centred board name
