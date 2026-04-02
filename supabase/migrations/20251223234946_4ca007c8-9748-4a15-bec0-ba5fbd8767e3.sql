-- Add unique constraint to prevent duplicate applications per user per position
ALTER TABLE public.applications 
ADD CONSTRAINT unique_user_position UNIQUE (user_id, position_id);