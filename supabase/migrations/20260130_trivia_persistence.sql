create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now(),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed')),
  host_player_id uuid null,
  guest_player_id uuid null,
  current_turn_player_id uuid null,
  active_question_id uuid null,
  active_category text null check (active_category in ('History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random')),
  turn_number int not null default 0,
  winner_player_id uuid null,
  allow_category_choice boolean not null default false
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_id uuid not null,
  name text not null,
  role text not null check (role in ('host', 'guest')),
  score int not null default 0,
  streak int not null default 0,
  categories_completed text[] not null default '{}'::text[]
);

create table if not exists public.game_questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  category text not null check (category in ('History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random')),
  question_text text not null,
  choices text[] not null,
  correct_index smallint not null,
  quip_correct text not null,
  quip_wrong text not null,
  used_at_turn int null,
  used_by_player_id uuid null
);

create index if not exists game_players_game_id_idx on public.game_players(game_id);
create unique index if not exists game_players_game_role_idx on public.game_players(game_id, role);
create unique index if not exists game_players_game_user_idx on public.game_players(game_id, user_id);
create index if not exists game_questions_game_category_idx on public.game_questions(game_id, category);
create index if not exists games_status_idx on public.games(status);

alter table public.games
  add constraint games_host_player_fk foreign key (host_player_id) references public.game_players(id) on delete set null;
alter table public.games
  add constraint games_guest_player_fk foreign key (guest_player_id) references public.game_players(id) on delete set null;
alter table public.games
  add constraint games_current_turn_fk foreign key (current_turn_player_id) references public.game_players(id) on delete set null;
alter table public.games
  add constraint games_winner_fk foreign key (winner_player_id) references public.game_players(id) on delete set null;
alter table public.games
  add constraint games_active_question_fk foreign key (active_question_id) references public.game_questions(id) on delete set null;

alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.game_questions enable row level security;

alter table public.games force row level security;
alter table public.game_players force row level security;
alter table public.game_questions force row level security;

create policy "Games are readable by members" on public.games
  for select using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = games.id and gp.user_id = auth.uid()
    )
  );

create policy "Games are readable for open seats" on public.games
  for select using (
    guest_player_id is null
  );

create policy "Create games" on public.games
  for insert with check (auth.uid() is not null);

create policy "Members can update games" on public.games
  for update using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = games.id and gp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = games.id and gp.user_id = auth.uid()
    )
  );

create policy "Game players are readable by members" on public.game_players
  for select using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = game_players.game_id and gp.user_id = auth.uid()
    )
  );

create policy "Players can join games once" on public.game_players
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.games g where g.id = game_id)
    and (
      (role = 'host' and not exists (
        select 1 from public.game_players gp where gp.game_id = game_id and gp.role = 'host'
      ))
      or
      (role = 'guest' and not exists (
        select 1 from public.game_players gp where gp.game_id = game_id and gp.role = 'guest'
      ))
    )
  );

create policy "Questions are readable by members" on public.game_questions
  for select using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = game_questions.game_id and gp.user_id = auth.uid()
    )
  );

create or replace view public.game_questions_public
  with (security_barrier = true) as
  select
    id,
    game_id,
    created_at,
    category,
    question_text,
    choices,
    quip_correct,
    quip_wrong
  from public.game_questions;

revoke all on public.game_questions from anon, authenticated;
grant select on public.game_questions_public to anon, authenticated;
