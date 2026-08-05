import { Phone, ShieldAlert, Share2, X, Check } from "lucide-react";
import type { EmergencyContacts } from "@/services/safety";

/**
 * What she sees the instant the shield is pressed.
 *
 * The alert has already fired server-side by the time this opens — this screen
 * is not the alarm, it is what she does next. Three decisions went into it:
 *
 * 1. Emergency services first, biggest, and a real `tel:` link. HeRide cannot
 *    dispatch police. Anything that implies otherwise is a lie told to someone
 *    in danger, so the app says plainly that it did not call them.
 * 2. Trusted contacts are one tap each, because "we sent an SMS" is a promise
 *    about a network, and she can hear a ringing phone.
 * 3. No confirmation step and no undo on the way in. She can close it; she
 *    cannot accidentally spend three taps cancelling something she meant.
 */
export function EmergencySheet({
  contacts,
  shareUrl,
  onShare,
  onClose,
}: {
  readonly contacts: EmergencyContacts | null;
  readonly shareUrl: string | null;
  readonly onShare: () => void;
  readonly onClose: () => void;
}) {
  const emergencyNumber = contacts?.emergencyNumber ?? "999";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Emergency"
      className="fixed inset-0 z-[100] flex flex-col bg-background/98 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <p className="font-display text-lg text-foreground">Emergency alert active</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-foreground">
            HeRide has been alerted and your trip is being watched.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We have <span className="font-semibold">not</span> called the police — we cannot do that
            for you. If you are in danger, call {emergencyNumber} now.
          </p>
        </div>

        <a
          href={`tel:${emergencyNumber}`}
          className="flex items-center justify-center gap-3 rounded-2xl bg-destructive py-5 text-lg font-semibold text-white shadow-glow"
        >
          <Phone className="h-6 w-6" /> Call {emergencyNumber}
        </a>

        {contacts && contacts.contacts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Your trusted contacts
            </p>
            {contacts.contacts.map((c) => (
              <a
                key={c.phone}
                href={`tel:${c.phone}`}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {c.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{c.phone}</span>
                </span>
                {c.isAppUser && (
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-primary">
                    <Check className="h-3 w-3" /> Alerted
                  </span>
                )}
              </a>
            ))}
            <p className="text-xs text-muted-foreground">
              Contacts marked “Alerted” have HeRide and were notified in the app. The others are
              queued for SMS — ring them if you can.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 p-4">
            <p className="text-sm text-foreground">No trusted contacts saved.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Only HeRide was alerted. Add contacts in your profile so there is someone to reach
              next time.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onShare}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 py-3 text-sm text-foreground"
        >
          <Share2 className="h-4 w-4" />
          {shareUrl ? "Share your live location again" : "Share your live location"}
        </button>
      </div>
    </div>
  );
}
