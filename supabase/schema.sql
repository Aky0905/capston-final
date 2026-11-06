-- Supabase SQL Editor에서 실행하세요. 계정 생성은 Supabase Auth를 사용합니다.
create table if not exists public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"entries":[],"favorites":[],"playlists":[],"recent":[],"name":""}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint library_is_object check (jsonb_typeof(data) = 'object'),
  constraint library_size check (octet_length(data::text) <= 2097152)
);
alter table public.libraries enable row level security;
revoke all on public.libraries from anon;
grant select, insert, update, delete on public.libraries to authenticated;
drop policy if exists "Own library only" on public.libraries;
create policy "Own library only" on public.libraries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- 캡스톤 단일 기기 사용을 위한 문서형 저장 구조입니다.
-- 다중 기기 동시 편집이 필요해지면 기록/플레이리스트 테이블을 분리하고 충돌 처리를 추가하세요.
