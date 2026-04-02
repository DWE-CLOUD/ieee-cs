-- Ensure accepted applications show team badges by creating team membership rows

-- 1) Ensure a user can only be added once per team
CREATE UNIQUE INDEX IF NOT EXISTS team_members_user_team_unique_idx
ON public.team_members (user_id, team_id);

-- 2) Allow team managers (and admins) to insert/update team members for their team
DROP POLICY IF EXISTS "Team managers can insert team members" ON public.team_members;
CREATE POLICY "Team managers can insert team members"
ON public.team_members
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_manager(auth.uid(), team_id)
);

DROP POLICY IF EXISTS "Team managers can update team members" ON public.team_members;
CREATE POLICY "Team managers can update team members"
ON public.team_members
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_manager(auth.uid(), team_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_manager(auth.uid(), team_id)
);

-- 3) Backfill team_members for already-accepted applications
INSERT INTO public.team_members (user_id, team_id, position_title, joined_at)
SELECT a.user_id, p.team_id, p.title, now()
FROM public.applications a
JOIN public.positions p ON p.id = a.position_id
WHERE a.status = 'accepted'
  AND p.team_id IS NOT NULL
ON CONFLICT (user_id, team_id) DO NOTHING;
