create table if not exists public.notifications (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    type text not null check (type in ('info', 'warning', 'success', 'error')),
    title text not null,
    message text not null,
    link text,
    is_read boolean not null default false,
    created_at timestamp with time zone not null default now(),
    metadata jsonb default '{}'::jsonb,
    
    constraint notifications_pkey primary key (id)
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- RLS Policies
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark read)"
    on public.notifications for update
    using (auth.uid() = user_id);

-- Admins can insert notifications
-- Fixed: Removed 'admin' from check as it is not a valid enum value for user_role. 
-- Only 'platform_admin' is used for super admin privileges.
create policy "Admins can insert notifications"
    on public.notifications for insert
    with check ( exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    ));
