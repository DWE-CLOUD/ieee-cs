CREATE TABLE IF NOT EXISTS public.team_member_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_member_id uuid,
  action text NOT NULL,
  summary text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_member_audit_logs_team_created
ON public.team_member_audit_logs(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_member_audit_logs_actor
ON public.team_member_audit_logs(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_member_audit_logs_target
ON public.team_member_audit_logs(target_user_id, created_at DESC);
