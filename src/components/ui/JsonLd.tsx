/** Structured data. Emitted in the body, which search engines accept, so it
 *  does not depend on head-script rendering order. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Serialised by us from local data — no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
