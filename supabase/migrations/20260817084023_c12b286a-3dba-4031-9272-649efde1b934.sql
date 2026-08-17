CREATE TABLE public.scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  host text NOT NULL,
  final_url text,
  score integer NOT NULL,
  verdict text NOT NULL,
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scans_created_at_idx ON public.scans (created_at DESC);
CREATE INDEX scans_host_idx ON public.scans (host);

GRANT SELECT ON public.scans TO anon;
GRANT SELECT ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scan results are publicly readable"
  ON public.scans FOR SELECT
  TO anon, authenticated
  USING (true);