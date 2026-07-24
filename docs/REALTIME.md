# HeRide Real-time Guide

All real-time behavior runs on **Supabase Realtime** (`postgres_changes`
over websockets). There is no separate socket server: the database is the
event source, RLS is the room-access control, and the JWT on the client's
Supabase connection is the socket authentication.

## Channels in use

| Channel | Table / filter | Who listens | Purpose |
| --- | --- | --- | --- |
| `ride:<id>`-style (per ride) | `rides`, `id=eq.<rideId>` | Passenger trip screen, driver active-trip card | Lifecycle sync: accepted → arrived → in_progress → completed / cancelled |
| `open-rides` | `rides` (pool refetch on any event) | Online drivers | New requests appear / claimed requests disappear |
| `driver-location:<driverId>` | `driver_locations`, `driver_user_id=eq.<id>` | The matched passenger | Live GPS stream (driver heartbeats every 15 s) |
| `notifications:<userId>` | `notifications`, `user_id=eq.<id>` | Everyone signed in | Bell feed |

RLS applies to realtime delivery: a client only ever receives rows it is
allowed to SELECT. The per-driver location channel is additionally filtered
server-side, and after `phase7-dispatch.sql` a passenger can read a busy
driver's position **only** while sharing an active ride with them.

## Event flow of a ride

1. Passenger inserts `rides` row (`requested`) → open-pool listeners fire.
2. Driver claims via `claim_ride` → passenger's ride channel fires
   (`accepted`), pool listeners see it leave, driver goes busy.
3. Driver heartbeats GPS → passenger's location channel streams position.
4. Driver advances status (`arrived`, `in_progress`) → ride channel fires;
   `complete_ride` settles money atomically → ride channel fires final state.
5. Every status change also inserts a `notifications` row via trigger →
   bell updates live.
6. If nobody accepts within 10 minutes, `expire_stale_ride_requests`
   cancels the ride (pg_cron) → passenger's screen updates like any other
   cancellation.

## Resilience patterns already implemented

- **Heartbeat / presence:** `driver_locations.updated_at`; dispatch ignores
  pings older than 2 minutes, so crashed driver apps age out naturally.
- **Missed-event recovery:** `useRide` refetches the ride on
  `visibilitychange` — mobile browsers suspend sockets in background tabs.
- **Passenger-cancel sync:** the driver screen subscribes to its active
  ride and releases the driver the moment the passenger cancels; a DB
  trigger restores the driver's availability even if her app is closed.
- **Atomicity over broadcast races:** ranking/broadcast order never decides
  correctness — `claim_ride`'s row-level `WHERE status='requested' AND
  driver_id IS NULL` does.

## Maps

The trip/driver screens render a live map via `TripMap`, which selects an
engine from `VITE_MAP_PROVIDER`:

- **`leaflet`** (default) — free CARTO/OSM dark tiles, no API key.
  **Road-following routes + ETA** via the free OSRM routing service
  (`router.project-osrm.org`, keyless); falls back to a straight line if
  routing is momentarily unavailable, so the map always works. For production
  scale, self-host OSRM or swap in a keyed routing provider.
- **`google`** — Google Maps with road-following routes (Directions API) and
  live ETA, plus Places address autocomplete in the booking flow. Requires
  `VITE_GOOGLE_MAPS_API_KEY` (or the existing
  `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`) with **Maps JavaScript
  API + Directions API + Places API enabled**, billing on, and the app's
  domains added to the key's HTTP-referrer allowlist.

Both engines take the same props and are driven by the same
`useDriverLocation` stream. If Google is selected but its key is rejected at
render time (bad referrer, billing, quota — Google's `gm_authFailure`), the
map **auto-falls back to Leaflet**, so users never see Google's error card.

## Scaling notes

Realtime fan-out is handled by Supabase's infrastructure; the client tier is
stateless. When load demands it: move ranking server-side onto
`nearest_available_drivers` (or PostGIS), scope the open-pool broadcast by
region, and only then consider an external presence cache. The service
interfaces (`IDriverService`, `IRidesService`, `IRideRankingStrategy`) are
the seams — screens will not change.
