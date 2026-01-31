-- Add DELETE policy for users to clear their own notifications
create policy "Users can delete their own notifications"
    on public.notifications for delete
    using (auth.uid() = user_id);
