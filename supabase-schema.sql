-- Jackal Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  avatar_color text,
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
  image_url text,
  pos_x float default 100,
  pos_y float default 100,
  rotation float default 0,
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

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.posts enable row level security;
alter table public.task_items enable row level security;
alter table public.reactions enable row level security;
alter table public.board_invites enable row level security;

-- Profiles: readable by authenticated users, writable by owner
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Boards: readable/writable by board members
create policy "Board members can read boards"
  on public.boards for select
  to authenticated
  using (
    exists (
      select 1 from public.board_members
      where board_id = id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create boards"
  on public.boards for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Board owners can update boards"
  on public.boards for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Board owners can delete boards"
  on public.boards for delete
  to authenticated
  using (owner_id = auth.uid());

-- Board members: readable by members, insertable by owners
create policy "Board members can read membership"
  on public.board_members for select
  to authenticated
  using (
    exists (
      select 1 from public.board_members bm2
      where bm2.board_id = board_id and bm2.user_id = auth.uid()
    )
  );

create policy "Board owners can add members"
  on public.board_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.board_members
      where board_id = board_members.board_id
        and user_id = auth.uid()
        and role = 'owner'
    )
    or user_id = auth.uid() -- allow self-join via invite
  );

create policy "Board owners can remove members"
  on public.board_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.board_members bm2
      where bm2.board_id = board_id and bm2.user_id = auth.uid() and bm2.role = 'owner'
    )
  );

-- Posts: readable/writable by board members
create policy "Board members can read posts"
  on public.posts for select
  to authenticated
  using (
    exists (
      select 1 from public.board_members
      where board_id = posts.board_id and user_id = auth.uid()
    )
  );

create policy "Board members can create posts"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.board_members
      where board_id = posts.board_id and user_id = auth.uid()
    )
  );

create policy "Board members can update posts"
  on public.posts for update
  to authenticated
  using (
    exists (
      select 1 from public.board_members
      where board_id = posts.board_id and user_id = auth.uid()
    )
  );

create policy "Authors can delete their posts"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());

-- Task items: accessible by board members
create policy "Board members can read task items"
  on public.task_items for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.board_members bm on bm.board_id = p.board_id
      where p.id = task_items.post_id and bm.user_id = auth.uid()
    )
  );

create policy "Board members can manage task items"
  on public.task_items for all
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.board_members bm on bm.board_id = p.board_id
      where p.id = task_items.post_id and bm.user_id = auth.uid()
    )
  );

-- Reactions
create policy "Board members can read reactions"
  on public.reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.board_members bm on bm.board_id = p.board_id
      where p.id = reactions.post_id and bm.user_id = auth.uid()
    )
  );

create policy "Board members can manage own reactions"
  on public.reactions for all
  to authenticated
  using (user_id = auth.uid());

-- Board invites
create policy "Board owners can manage invites"
  on public.board_invites for all
  to authenticated
  using (
    exists (
      select 1 from public.board_members
      where board_id = board_invites.board_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "Anyone can read their own invite by token"
  on public.board_invites for select
  to authenticated
  using (true); -- token-based access, validated in app code

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime in the Supabase dashboard for:
-- public.posts, public.task_items, public.reactions
-- Or run:
-- alter publication supabase_realtime add table public.posts;
-- alter publication supabase_realtime add table public.task_items;
-- alter publication supabase_realtime add table public.reactions;
