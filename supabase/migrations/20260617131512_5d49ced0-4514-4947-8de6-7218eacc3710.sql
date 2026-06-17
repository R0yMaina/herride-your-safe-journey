
CREATE TYPE public.app_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE public.gender AS ENUM ('female', 'male', 'other');
CREATE TYPE public.driver_verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE public.ride_status AS ENUM ('requested', 'matched', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.sos_status AS ENUM ('active', 'acknowledged', 'resolved', 'false_alarm');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT, gender public.gender, date_of_birth DATE, avatar_url TEXT,
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_female(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND gender = 'female')
$$;

CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL, national_id TEXT NOT NULL,
  selfie_url TEXT, id_document_url TEXT,
  vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT, vehicle_color TEXT, vehicle_year INT,
  verification_status public.driver_verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ, verified_by UUID REFERENCES auth.users(id), rejection_reason TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00, total_rides INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drivers_status ON public.drivers(verification_status);
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_verified_female_driver(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.drivers d
    JOIN public.profiles p ON p.id = d.user_id
    WHERE d.user_id = _user_id AND d.verification_status = 'verified'
      AND p.gender = 'female' AND p.is_blacklisted = false
  )
$$;

CREATE TABLE public.driver_locations (
  driver_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL, heading DOUBLE PRECISION,
  is_available BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_driver_locations_avail ON public.driver_locations(is_available) WHERE is_available = true;
CREATE INDEX idx_driver_locations_geo ON public.driver_locations(lat, lng);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_locations TO authenticated;
GRANT ALL ON public.driver_locations TO service_role;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_lat DOUBLE PRECISION NOT NULL, pickup_lng DOUBLE PRECISION NOT NULL, pickup_address TEXT,
  drop_lat DOUBLE PRECISION NOT NULL, drop_lng DOUBLE PRECISION NOT NULL, drop_address TEXT,
  status public.ride_status NOT NULL DEFAULT 'requested',
  fare_estimate NUMERIC(10,2), fare_final NUMERIC(10,2), distance_km NUMERIC(10,2),
  cancellation_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rides_passenger ON public.rides(passenger_id);
CREATE INDEX idx_rides_driver ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_status_open ON public.rides(status) WHERE status = 'requested';
GRANT SELECT, INSERT, UPDATE ON public.rides TO authenticated;
GRANT ALL ON public.rides TO service_role;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_female_only_ride()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_female(NEW.passenger_id) THEN
    RAISE EXCEPTION 'HerRide is reserved for female passengers';
  END IF;
  IF NEW.driver_id IS NOT NULL AND NOT public.is_verified_female_driver(NEW.driver_id) THEN
    RAISE EXCEPTION 'Driver must be a verified female driver';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rides_female_only BEFORE INSERT OR UPDATE OF passenger_id, driver_id ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.enforce_female_only_ride();

CREATE TABLE public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ride_id, rater_id)
);
CREATE INDEX idx_ratings_ratee ON public.ride_ratings(ratee_id);
GRANT SELECT, INSERT ON public.ride_ratings TO authenticated;
GRANT ALL ON public.ride_ratings TO service_role;
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  status public.sos_status NOT NULL DEFAULT 'active',
  notes TEXT, resolved_by UUID REFERENCES auth.users(id), resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sos_status ON public.sos_alerts(status);
CREATE INDEX idx_sos_user ON public.sos_alerts(user_id);
GRANT SELECT, INSERT, UPDATE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, phone TEXT NOT NULL, relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_user ON public.trusted_contacts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trusted_contacts TO authenticated;
GRANT ALL ON public.trusted_contacts TO service_role;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trip_shares_token ON public.trip_shares(share_token);
GRANT SELECT, INSERT, DELETE ON public.trip_shares TO authenticated;
GRANT SELECT ON public.trip_shares TO anon;
GRANT ALL ON public.trip_shares TO service_role;
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity_type TEXT, entity_id UUID,
  metadata JSONB, ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Profiles own read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Roles read own or admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers select own/verified/admin" ON public.drivers FOR SELECT TO authenticated USING (user_id = auth.uid() OR verification_status = 'verified' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers own insert" ON public.drivers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Drivers own update" ON public.drivers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "DriverLoc own write" ON public.driver_locations FOR ALL TO authenticated USING (driver_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (driver_user_id = auth.uid());
CREATE POLICY "DriverLoc passengers read available" ON public.driver_locations FOR SELECT TO authenticated USING (is_available = true OR driver_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Rides select parties" ON public.rides FOR SELECT TO authenticated USING (
  passenger_id = auth.uid() OR driver_id = auth.uid()
  OR (status = 'requested' AND public.is_verified_female_driver(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Rides passenger insert" ON public.rides FOR INSERT TO authenticated WITH CHECK (passenger_id = auth.uid() AND public.is_female(auth.uid()));
CREATE POLICY "Rides parties update" ON public.rides FOR UPDATE TO authenticated USING (passenger_id = auth.uid() OR driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (passenger_id = auth.uid() OR driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Ratings read parties" ON public.ride_ratings FOR SELECT TO authenticated USING (rater_id = auth.uid() OR ratee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ratings insert as rater" ON public.ride_ratings FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid() AND EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid()) AND r.status = 'completed'));

CREATE POLICY "SOS owner or admin select" ON public.sos_alerts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "SOS owner insert" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "SOS owner/admin update" ON public.sos_alerts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Contacts own" ON public.trusted_contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "TripShares passenger insert" ON public.trip_shares FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.passenger_id = auth.uid()));
CREATE POLICY "TripShares public read" ON public.trip_shares FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "TripShares owner delete" ON public.trip_shares FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Audit self insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, gender)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone',
          NULLIF(NEW.raw_user_meta_data->>'gender', '')::public.gender)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_rides_updated BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- NEAREST DRIVERS RPC (haversine, verified female only)
CREATE OR REPLACE FUNCTION public.nearest_available_drivers(
  _lat DOUBLE PRECISION, _lng DOUBLE PRECISION,
  _radius_km DOUBLE PRECISION DEFAULT 5, _limit INT DEFAULT 10
) RETURNS TABLE (
  driver_user_id UUID, lat DOUBLE PRECISION, lng DOUBLE PRECISION, distance_km DOUBLE PRECISION,
  rating NUMERIC, vehicle_make TEXT, vehicle_model TEXT, vehicle_plate TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT
      dl.driver_user_id, dl.lat, dl.lng,
      (6371 * acos(cos(radians(_lat)) * cos(radians(dl.lat))
        * cos(radians(dl.lng) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(dl.lat)))) AS distance_km,
      d.rating, d.vehicle_make, d.vehicle_model, d.vehicle_plate
    FROM public.driver_locations dl
    JOIN public.drivers d ON d.user_id = dl.driver_user_id
    JOIN public.profiles p ON p.id = dl.driver_user_id
    WHERE dl.is_available = true
      AND d.verification_status = 'verified'
      AND p.gender = 'female'
      AND p.is_blacklisted = false
      AND dl.updated_at > now() - interval '2 minutes'
  ) s
  WHERE s.distance_km <= _radius_km
  ORDER BY s.distance_km ASC
  LIMIT _limit;
$$;

-- ATOMIC RIDE CLAIM
CREATE OR REPLACE FUNCTION public.claim_ride(_ride_id UUID)
RETURNS public.rides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rides;
BEGIN
  IF NOT public.is_verified_female_driver(auth.uid()) THEN
    RAISE EXCEPTION 'Only verified female drivers can claim rides';
  END IF;
  UPDATE public.rides
    SET driver_id = auth.uid(), status = 'accepted', accepted_at = now()
    WHERE id = _ride_id AND status = 'requested' AND driver_id IS NULL
    RETURNING * INTO r;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Ride is no longer available';
  END IF;
  RETURN r;
END; $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER TABLE public.sos_alerts REPLICA IDENTITY FULL;
