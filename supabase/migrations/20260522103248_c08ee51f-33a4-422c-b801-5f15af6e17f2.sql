
-- Add resume_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url text;

-- Portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio viewable by everyone" ON public.portfolio_items
  FOR SELECT USING (true);
CREATE POLICY "Users insert own portfolio" ON public.portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own portfolio" ON public.portfolio_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own portfolio" ON public.portfolio_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('gig-images', 'gig-images', true),
  ('portfolio', 'portfolio', true),
  ('resumes', 'resumes', false),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Public bucket read policies
CREATE POLICY "Public buckets are viewable" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars','gig-images','portfolio'));

-- Private bucket read: owner only (path is user_id/...)
CREATE POLICY "Owners view private files" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('resumes','attachments')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Upload to any bucket: must be under own folder
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('avatars','gig-images','portfolio','resumes','attachments')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('avatars','gig-images','portfolio','resumes','attachments')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars','gig-images','portfolio','resumes','attachments')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
