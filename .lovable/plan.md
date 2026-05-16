
# HerRide — Premium Mobile App UI

A mobile-first, investor-grade web prototype of a female-only ride-hailing app. Built as a single TanStack Start app where each "screen" is its own route, framed inside a phone mockup on desktop and full-bleed on mobile. Design language: baby pink (#FFC0CB) + blush + deep black + soft glows + feminine doodle accents.

## Design System

- **Palette (oklch tokens in `src/styles.css`)**
  - `--background`: near-black `oklch(0.14 0.01 320)`
  - `--foreground`: soft white
  - `--primary` (baby pink): `oklch(0.86 0.08 5)` ≈ #FFC0CB
  - `--primary-glow`: hotter pink for glows
  - `--blush`: soft blush surface
  - `--card`: elevated black with pink tint
  - Gradients: `--gradient-pink` (blush→pink→hot pink), `--gradient-noir` (black→deep plum)
  - Shadows: `--shadow-glow` (pink neon halo), `--shadow-soft` (luxury card lift)
- **Typography**
  - Display: `Fraunces` or `Cormorant` (elegant serif) for HerRide wordmark and hero headings
  - UI: `Inter` / `Manrope` for body and controls
- **Components**: rounded-2xl/3xl, glassy cards, glowing CTA buttons, pill chips, soft motion via framer-motion (fade-up, scale-in, route transitions).

## Screens (each its own route)

```
src/routes/
  index.tsx              -> Splash (HerRide logo, doodles, loader)
  auth.tsx               -> Login / Signup (tabs, female-only verification note)
  home.tsx               -> Map + "Where to?" search + quick actions
  book.tsx               -> Ride booking (pickup/drop, ride tiers, fare)
  matching.tsx           -> Female driver matching (pulse animation)
  trip.tsx               -> Live trip tracking (route line, ETA, driver card)
  sos.tsx                -> SOS emergency sheet (call, share, alert contacts)
  share-trip.tsx         -> Trip sharing with trusted contacts
  wallet.tsx             -> Wallet / payment methods + transactions
  ratings.tsx            -> Ratings & reviews (driver profile + history)
  scheduled.tsx          -> Scheduled rides
  shared-rides.tsx       -> Verified women shared rides
  favorites.tsx          -> Favorite drivers
  subscriptions.tsx      -> Commuter plans (Lite / Pro / Elite)
  student.tsx            -> Student discount section
```

A simple bottom tab bar (Home, Wallet, Schedule, Profile) overlays on app screens. Splash and Auth are full-bleed without the tab bar.

## Screen highlights

- **Splash**: deep black bg, glowing baby-pink "HerRide" serif wordmark, hand-drawn doodles (heels, lipstick, hearts, GPS pin, steering wheel, scooter, sparkles) scattered to edges, thin animated loading bar, slogan "Safe rides for women, by women."
- **Auth**: phone + OTP UI, "Verified Women Only" badge, social proof chip, soft pink gradient panel.
- **Home**: stylized map (SVG, not real Mapbox), floating "Where to?" search, saved places chips, promo banner for Student Discount, SOS quick button.
- **Book**: stacked location inputs, ride tier cards (HerLite, HerComfort, HerShare), fare estimate, "Female driver only" lock chip, glowing CTA.
- **Matching**: pulse rings around driver avatar, "Matching you with a verified female driver…", trust badges (Verified, Background Checked, Female).
- **Trip**: map with curved route, driver card (name, car, plate, rating), ETA, bottom action row (Share trip, SOS, Message).
- **SOS**: red-tinted sheet over pink, big "Hold to Alert" button, options: Call 911, Alert Contacts, Share Live Location.
- **Share Trip**: contact list with toggles, share link preview card.
- **Wallet**: balance card with gradient, payment methods (Card, Apple Pay, Wallet), recent rides list.
- **Ratings**: 5-star input, quick tags ("Felt safe", "Friendly", "Clean car"), past reviews.
- **Scheduled**: calendar strip + time picker + upcoming rides.
- **Shared Rides**: matched co-rider cards with verification badges, split fare.
- **Favorites**: saved drivers with "Request again" button.
- **Subscriptions**: 3 pricing tiers with feature checks, "Most loved" highlight.
- **Student**: verify with .edu, discount % hero, partner universities marquee.

Every app screen surfaces the brand pillars visually: Female drivers only · Female passengers only · Verified · Safety-first · Affordable.

## Technical Notes

- TanStack Start with file-based routes; each route sets its own `head()` meta (title + description) for SEO and shareability.
- Tokens in `src/styles.css` only — no hardcoded colors in components.
- `framer-motion` for screen transitions, pulse rings (matching), and SOS hold animation.
- Map visuals are custom SVG (curved routes, pins) — no third-party map SDK, keeps it Worker-safe and fast.
- Doodles delivered as inline SVG components in `src/components/doodles/` so they can glow via CSS filters.
- Phone-frame wrapper component centers screens on desktop (≥ md) and disappears on mobile.
- Reusable: `PhoneFrame`, `BottomTabBar`, `GlowButton`, `BrandPill`, `VerifiedBadge`, `MapCanvas`, `DriverCard`, `RideTierCard`, `SOSButton`.

## Deliverable

A polished, navigable prototype that feels like a real launch-ready app. Investor-deck quality: cohesive feminine luxury aesthetic, every screen on-brand, micro-interactions on key actions, and slogans woven into Splash, Auth, Home banner, and Subscriptions hero.

After approval I'll scaffold tokens + shared components first, then build screens in this order: Splash → Auth → Home → Book → Matching → Trip → SOS → Share → Wallet → Ratings → Scheduled → Shared → Favorites → Subscriptions → Student.
