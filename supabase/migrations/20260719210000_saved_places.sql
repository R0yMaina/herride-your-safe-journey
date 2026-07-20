-- Saved places: per-user favourite pickup/destination locations used by the
-- booking wizard. Owner-only access; coordinates stored as plain lat/lng to
-- match driver_locations.
CREATE TABLE public.saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_places_user ON public.saved_places(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_places TO authenticated;
GRANT ALL ON public.saved_places TO service_role;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SavedPlaces own" ON public.saved_places
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
