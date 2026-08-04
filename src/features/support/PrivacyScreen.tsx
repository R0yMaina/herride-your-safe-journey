import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { contact } from "@/config/contact";
import { POLICY_UPDATED, privacyFor } from "./data/privacy";
import { useT } from "@/i18n";

/**
 * The privacy policy. Required by the Kenya Data Protection Act 2019, and
 * doubly warranted here because the product holds national IDs, photographs of
 * faces and continuous location.
 *
 * Written in plain sentences on purpose. A policy nobody can read satisfies a
 * regulator and nobody else, and this audience is being asked to trust us with
 * where they are at night.
 */
export function PrivacyScreen() {
  const { t, language } = useT();
  const { sections, translationNote } = privacyFor(language);
  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader
          eyebrow={t("profile.privacy")}
          title="What we know about you"
          subtitle={`And what we do with it. Last updated ${POLICY_UPDATED}.`}
        />

        {translationNote && (
          <GlassCard className="py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">{translationNote}</p>
          </GlassCard>
        )}

        {sections.map((section) => (
          <Section key={section.id} title={section.heading}>
            <GlassCard className="space-y-3 py-4">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </GlassCard>
          </Section>
        ))}

        <GlassCard className="py-4">
          <p className="text-sm text-muted-foreground">
            Questions about any of this?{" "}
            <a href={`mailto:${contact.email}`} className="font-semibold text-primary">
              {contact.email}
            </a>
          </p>
        </GlassCard>
      </Container>
    </ScreenWrapper>
  );
}
