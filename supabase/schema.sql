create table if not exists public.attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null check (exam in ('CPRO_I', 'CPRO_R')),
  score integer not null check (score between 0 and 100),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at desc);
alter table public.attempts enable row level security;
create policy "Usuário lê apenas as próprias tentativas" on public.attempts for select using (auth.uid() = user_id);
create policy "Usuário cria apenas as próprias tentativas" on public.attempts for insert with check (auth.uid() = user_id);
create policy "Usuário exclui apenas as próprias tentativas" on public.attempts for delete using (auth.uid() = user_id);
