-- Add form_fields column to positions table to store custom form configuration
ALTER TABLE public.positions 
ADD COLUMN form_fields jsonb DEFAULT '[]'::jsonb;

-- Create table to store custom application responses
CREATE TABLE public.application_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  field_id text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  response_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own responses
CREATE POLICY "Users can insert own responses"
ON public.application_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
ON public.application_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Admins can view all responses
CREATE POLICY "Admins can manage responses"
ON public.application_responses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));