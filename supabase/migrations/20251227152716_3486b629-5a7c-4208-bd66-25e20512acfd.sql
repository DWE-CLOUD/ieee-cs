-- Add is_head column to team_members table
ALTER TABLE public.team_members ADD COLUMN is_head boolean NOT NULL DEFAULT false;

-- Create index for faster head lookups
CREATE INDEX idx_team_members_is_head ON public.team_members(team_id, is_head) WHERE is_head = true;

-- Create a function to ensure only one head per team
CREATE OR REPLACE FUNCTION public.ensure_single_team_head()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_head = true THEN
    -- Set all other members of the same team to not be head
    UPDATE public.team_members 
    SET is_head = false 
    WHERE team_id = NEW.team_id 
      AND id != NEW.id 
      AND is_head = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce single head per team
CREATE TRIGGER enforce_single_team_head
BEFORE INSERT OR UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_team_head();