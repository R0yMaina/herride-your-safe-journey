import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Instagram,
  Mail,
  MessageSquareWarning,
  Music2,
  Phone,
} from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { contact, supportMailto } from "@/config/contact";
import { cn } from "@/lib/utils";
import { faqsFor } from "./data/faqs";
import { useT } from "@/i18n";

/** Per-network glyph; anything we don't recognise still gets a sensible mark. */
const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
};

function FaqItem({ question, answer }: { readonly question: string; readonly answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </GlassCard>
  );
}

/**
 * Help & support. Previously this row linked back to the profile page it was
 * on, so tapping it did nothing.
 *
 * Answers come from `data/faqs.ts`, which quotes the live pricing config rather
 * than hardcoded figures — so what a rider reads here cannot drift from what
 * she is actually charged.
 */
export function SupportScreen() {
  const { language } = useT();
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow="Help & support"
          title="We're here"
          subtitle="Answers to the usual questions, and a real person when you need one."
        />

        {/* First, not buried: an app alarm is not an emergency service. */}
        <GlassCard className="flex items-start gap-3 border-primary/30">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base text-foreground">In immediate danger?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Call emergency services on{" "}
              <a href={`tel:${contact.emergencyNumber}`} className="font-semibold text-primary">
                {contact.emergencyNumber}
              </a>{" "}
              first. In-app SOS alerts your trusted contacts and our safety team — it does not call
              the police for you.
            </p>
          </div>
        </GlassCard>

        <Section title="Contact us">
          <div className="space-y-2">
            <a href={supportMailto("HeRide support request")}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">Email us</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {contact.email}
                  </span>
                </span>
              </GlassCard>
            </a>

            <a
              href={supportMailto(
                "Report an issue",
                "Tell us what happened, and when (a date and rough time helps us find the trip):\n\n",
              )}
            >
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Report an issue
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    A trip, a driver, a charge, or something you left behind
                  </span>
                </span>
              </GlassCard>
            </a>

            <a href={`tel:${contact.emergencyNumber}`}>
              <GlassCard className="flex items-center gap-4 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base text-foreground">
                    Emergency services
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Call {contact.emergencyNumber} — police, ambulance, fire
                  </span>
                </span>
              </GlassCard>
            </a>
          </div>
        </Section>

        {contact.socials.length > 0 && (
          <Section title="Follow us">
            <div className="space-y-2">
              {contact.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.id] ?? Instagram;
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener">
                    <GlassCard className="flex items-center gap-4 py-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base text-foreground">
                          {s.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.handle}
                        </span>
                      </span>
                    </GlassCard>
                  </a>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Frequently asked">
          <div className="space-y-2">
            {faqsFor(language).map((faq) => (
              <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </Section>
      </Container>
    </ScreenWrapper>
  );
}
