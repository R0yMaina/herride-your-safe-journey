/**
 * Public contact channels, in one place so a changed handle is a one-line edit
 * rather than a hunt through screens.
 *
 * Anything falsy here is simply not rendered — never ship a placeholder social
 * link, since a wrong handle sends riders to a stranger's account.
 */
export const contact = Object.freeze({
  /** Official inbox. Reached via mailto:, so it must be a real address. */
  email: "heride@gmail.com",

  /** Kenyan emergency services. Shown wherever we talk about danger, because
   * an in-app SOS is not a substitute for calling the police. */
  emergencyNumber: "999",

  socials: Object.freeze([
    {
      id: "instagram",
      label: "Instagram",
      handle: "@herirideofficial",
      url: "https://www.instagram.com/herirideofficial?igsh=cjMyaWExMGpwcDl0",
    },
    // TikTok: add the handle here and the row appears. Left out deliberately —
    // guessing a URL risks pointing riders at an account that isn't ours.
    // { id: "tiktok", label: "TikTok", handle: "@…", url: "https://www.tiktok.com/@…" },
  ] as readonly {
    readonly id: string;
    readonly label: string;
    readonly handle: string;
    readonly url: string;
  }[]),
});

/** A mailto link with the subject pre-filled, so replies arrive pre-triaged. */
export function supportMailto(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${contact.email}?${params.toString()}`;
}
