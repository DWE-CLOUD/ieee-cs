-- Add 'manager' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- Create team_managers table to link managers to specific teams
CREATE TABLE public.team_managers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;

-- Admins can manage team_managers
CREATE POLICY "Admins can manage team managers"
ON public.team_managers
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view their own team manager assignments
CREATE POLICY "Users can view own team assignments"
ON public.team_managers
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check if user is manager of a team
CREATE OR REPLACE FUNCTION public.is_team_manager(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_managers
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Update positions policies to allow managers of the team to manage positions
CREATE POLICY "Team managers can insert positions for their team"
ON public.positions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  (team_id IS NOT NULL AND is_team_manager(auth.uid(), team_id))
);

CREATE POLICY "Team managers can update positions for their team"
ON public.positions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  (team_id IS NOT NULL AND is_team_manager(auth.uid(), team_id))
);

CREATE POLICY "Team managers can delete positions for their team"
ON public.positions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  (team_id IS NOT NULL AND is_team_manager(auth.uid(), team_id))
);

-- Allow managers to view applications for positions in their team
CREATE POLICY "Team managers can view applications for their team"
ON public.applications
FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.positions p 
    WHERE p.id = position_id 
    AND p.team_id IS NOT NULL 
    AND is_team_manager(auth.uid(), p.team_id)
  )
);

-- Allow managers to update applications for positions in their team
CREATE POLICY "Team managers can update applications for their team"
ON public.applications
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.positions p 
    WHERE p.id = position_id 
    AND p.team_id IS NOT NULL 
    AND is_team_manager(auth.uid(), p.team_id)
  )
);

-- Allow managers to view application responses for their team
CREATE POLICY "Team managers can view responses for their team"
ON public.application_responses
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM applications a
    JOIN positions p ON p.id = a.position_id
    WHERE a.id = application_id
    AND (a.user_id = auth.uid() OR (p.team_id IS NOT NULL AND is_team_manager(auth.uid(), p.team_id)))
  )
);