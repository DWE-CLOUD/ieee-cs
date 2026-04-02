-- Add columns to applications for tracking acceptance and remarks
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS remarks text;

-- Create gallery_collaborators table to track who can manage gallery
CREATE TABLE IF NOT EXISTS public.gallery_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on gallery_collaborators
ALTER TABLE public.gallery_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery_collaborators
CREATE POLICY "Admins can manage gallery collaborators" 
ON public.gallery_collaborators 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own collaborator status" 
ON public.gallery_collaborators 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to check if user is gallery collaborator
CREATE OR REPLACE FUNCTION public.is_gallery_collaborator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gallery_collaborators
    WHERE user_id = _user_id
  )
$$;

-- Update gallery_albums policies to allow collaborators
DROP POLICY IF EXISTS "Admins can insert albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Admins can update albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Admins can delete albums" ON public.gallery_albums;

CREATE POLICY "Admins and collaborators can insert albums" 
ON public.gallery_albums 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));

CREATE POLICY "Admins and collaborators can update albums" 
ON public.gallery_albums 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));

CREATE POLICY "Admins and collaborators can delete albums" 
ON public.gallery_albums 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));

-- Update gallery_images policies to allow collaborators
DROP POLICY IF EXISTS "Admins can insert gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can update gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON public.gallery_images;

CREATE POLICY "Admins and collaborators can insert gallery images" 
ON public.gallery_images 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));

CREATE POLICY "Admins and collaborators can update gallery images" 
ON public.gallery_images 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));

CREATE POLICY "Admins and collaborators can delete gallery images" 
ON public.gallery_images 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR is_gallery_collaborator(auth.uid()));