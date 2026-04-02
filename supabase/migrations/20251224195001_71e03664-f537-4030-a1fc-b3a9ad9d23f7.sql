-- Create albums table
CREATE TABLE public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date DATE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album_id to gallery_images
ALTER TABLE public.gallery_images 
ADD COLUMN album_id UUID REFERENCES public.gallery_albums(id) ON DELETE CASCADE;

-- Enable RLS on albums
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

-- RLS policies for albums
CREATE POLICY "Anyone can view albums" 
ON public.gallery_albums 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert albums" 
ON public.gallery_albums 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update albums" 
ON public.gallery_albums 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete albums" 
ON public.gallery_albums 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_gallery_albums_updated_at
BEFORE UPDATE ON public.gallery_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();