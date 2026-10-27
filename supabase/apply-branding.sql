-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — MARCA DEL PROFESIONAL Y FOTO DE PERFIL
-- ----------------------------------------------------------------------------
-- Crea lo que faltaba en producción:
--   1. public.nutritionist_profiles  → tu marca en el PDF (nombre, cédula,
--      clínica, logo, color de acento).
--   2. profiles.avatar_url           → columna para la foto de perfil.
--   3. Bucket de Storage 'avatars'   → donde vive la foto (público de lectura,
--      escritura solo en tu propia carpeta).
--
-- Idempotente: se puede ejecutar varias veces.
-- ============================================================================

-- 1) Perfil de marca (una fila por usuaria)
create table if not exists public.nutritionist_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade unique,
  clinic_name       text,
  professional_name text,
  license_number    text,
  specialty         text,
  phone             text,
  address           text,
  website           text,
  accent_color      text default '#c9a961',
  logo_url          text,
  signature_url     text,
  updated_at        timestamptz default now()
);

alter table public.nutritionist_profiles enable row level security;

drop policy if exists "own profile" on public.nutritionist_profiles;
create policy "own profile" on public.nutritionist_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Columna para la foto de perfil
alter table public.profiles add column if not exists avatar_url text;

-- 3) Bucket de avatares
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Lectura pública (las fotos se muestran en el panel)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Escritura solo dentro de la carpeta de cada usuaria: avatars/<user_id>/...
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verificación: debe salir tabla=true, bucket=true
select
  (to_regclass('public.nutritionist_profiles') is not null) as tabla_marca,
  (select count(*) from storage.buckets where id = 'avatars') > 0 as bucket_avatares;
