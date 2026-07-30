import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  KeyRound,
  MessageSquareLock,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { ROUTES } from "@/constants/routes";
import { contact } from "@/config/contact";

interface Feature {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly Icon: LucideIcon;
}

/**
 * What each protection actually does — described in terms of what is enforced,
 * not what is promised. Every claim here maps to something in the schema or the
 * ride lifecycle; nothing is aspirational.
 */
const FEATURES: readonly Feature[] = [
  {
    id: "verified-women",
    title: "Women drivers only, verified by a person",
    body: "ID, a selfie matched to it, licence, and vehicle papers are reviewed before a driver can accept anything. Matching happens in the database, and it will only ever offer your ride to a driver who is verified and female — an unverified account cannot reach you.",
    Icon: BadgeCheck,
  },
  {
    id: "pickup-pin",
    title: "Pickup PIN",
    body: "A 4-digit code only you can see. Your driver must enter it before the trip can begin, so the trip cannot start unless she is with the right passenger. The rule is enforced by the database, not just the app.",
    Icon: KeyRound,
  },
  {
    id: "trip-share",
    title: "HerShare live trip link",
    body: "Share a link that shows your driver, her vehicle and your live position, updating until you arrive. Whoever you send it to needs no account, and the link expires with the trip.",
    Icon: Share2,
  },
  {
    id: "trusted-contacts",
    title: "Trusted contacts",
    body: "The people we notify first if you raise an alarm. Add or change them any time in your profile.",
    Icon: Users,
  },
  {
    id: "sos",
    title: "SOS",
    body: "Records an incident with your exact location, alerts your trusted contacts and flags the trip for our safety team. It is a record and an alert — not a call to the police.",
    Icon: ShieldAlert,
  },
  {
    id: "masked-contact",
    title: "Private numbers",
    body: "You and your driver talk through in-app chat. She never sees your phone number and you never see hers, during the trip or after it.",
    Icon: MessageSquareLock,
  },
];

/**
 * Safety suite. Previously this row linked back to the profile page it sat on,
 * so tapping it did nothing.
 */
export function SafetyScreen() {
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Safety suite"
          title="How you're protected"
          subtitle="Every one of these is on by default. Nothing here is something you have to remember to switch on."
        />

        {/* Stated plainly and first — the honest limit of an in-app alarm. */}
        <GlassCard className="flex items-start gap-3 border-primary/30">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base text-foreground">If you are in danger right now</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Call{" "}
              <a href={`tel:${contact.emergencyNumber}`} className="font-semibold text-primary">
                {contact.emergencyNumber}
              </a>{" "}
              first. Use SOS as well, so there is a record with your location — but it does not
              summon the police on your behalf.
            </p>
          </div>
        </GlassCard>

        <Section title="What's always on">
          <div className="space-y-2">
            {FEATURES.map(({ id, title, body, Icon }) => (
              <GlassCard key={id} className="flex items-start gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </Section>

        <Section title="Your settings">
          <div className="space-y-2">
            <Link to={ROUTES.profile}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Manage trusted contacts
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Who we alert first, in your profile
                  </span>
                </span>
              </GlassCard>
            </Link>
            <Link to={ROUTES.support}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Report a safety concern
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Tell us about a trip or a driver
                  </span>
                </span>
              </GlassCard>
            </Link>
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
