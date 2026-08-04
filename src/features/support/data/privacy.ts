import { contact } from "@/config/contact";
import type { Language } from "@/i18n";
import { PRIVACY_SECTIONS_SW, PRIVACY_TRANSLATION_NOTE_SW } from "./privacy.sw";

export interface PolicySection {
  readonly id: string;
  readonly heading: string;
  readonly body: readonly string[];
}

/**
 * Privacy policy, written to be read rather than to be survived.
 *
 * Kenya's Data Protection Act 2019 requires a controller to say what it
 * collects, why, how long it keeps it and who it shares it with. Retention
 * periods here match `enforce_retention()` in phase21 — if one changes, change
 * the other, or this becomes a promise the system does not keep.
 */
export const POLICY_UPDATED = "30 July 2026";

export const PRIVACY_SECTIONS: readonly PolicySection[] = [
  {
    id: "who",
    heading: "Who we are",
    body: [
      `HeRide is a women-only ride-hailing service operating in Kenya. We are the data controller for the information described here, and you can reach us at ${contact.email}.`,
    ],
  },
  {
    id: "what",
    heading: "What we collect",
    body: [
      "From riders: your name, phone number, email, and the gender you tell us at sign-up. Your pickup and drop-off locations, the route taken, what you paid, and any messages you send your driver through the app.",
      "For rider verification: a photograph of your face and of your national ID or passport, and optionally the ID number. These are seen only by the person who reviews them, are never shown to drivers or other riders, and are deleted when you delete your account.",
      "From drivers: everything above, plus your national ID, driving licence, vehicle registration and a photograph of your face. We take a fresh photograph periodically to confirm the person driving is still you.",
      "From your device: your location while you are using the app. For drivers, location while you are online — this is how riders near you can be matched to you.",
      "We do not collect your contacts, your photo library, or anything from other apps.",
    ],
  },
  {
    id: "why",
    heading: "Why we collect it",
    body: [
      "To match you with a driver, price and settle the trip, and let you and your driver reach each other without exchanging phone numbers.",
      "To keep the service women-only. Verifying identity and gender is the entire basis of the promise we make, and it is the reason we ask riders and drivers alike for documents most services would not.",
      "To respond to a safety incident. If you raise an alarm, your location and trip details go to your trusted contacts and to our safety team.",
      "To meet legal obligations — tax records, and responding to a lawful order.",
    ],
  },
  {
    id: "sharing",
    heading: "Who sees it",
    body: [
      "Your driver sees your first name, your pickup and destination, and your rating. She never sees your phone number.",
      "You see your driver's first name, photo, vehicle and rating. You never see her phone number.",
      "Anyone you send a live trip link to sees your driver, her vehicle and your position until the trip ends. You choose when to send one.",
      "Your trusted contacts are contacted only if you raise an alarm.",
      "Our processors: Supabase (database and storage) and Cloudflare (hosting). Map and address lookups go to Mapbox, CARTO, Photon or Google depending on configuration — those receive coordinates, never your identity.",
      "We do not sell your data. We do not share it for advertising.",
    ],
  },
  {
    id: "keeping",
    heading: "How long we keep it",
    body: [
      "Trip and payment records: kept for as long as tax and accounting law requires.",
      "Location history for offline drivers: deleted after 90 days.",
      "In-app messages: content removed after 365 days.",
      "Trip share links: deleted a week after they expire.",
      "Driver identity documents: kept while you drive with us, and removed when your account is deleted.",
    ],
  },
  {
    id: "rights",
    heading: "Your rights",
    body: [
      "You can see and correct your details in your profile at any time.",
      "You can delete your account from your profile. Doing so destroys your name, phone number, saved places, trusted contacts, message content and any identity documents. Your trips and payments survive without your name attached, because we are separately required to keep financial records — they can no longer be traced to you.",
      "We will ask you to withdraw any wallet balance first. That money is yours, and deleting it along with your data would not be a privacy feature.",
      "If you believe we have handled your data wrongly, you can complain to the Office of the Data Protection Commissioner in Kenya.",
    ],
  },
  {
    id: "security",
    heading: "How we protect it",
    body: [
      "Every table enforces row-level access rules in the database, so one account cannot read another's data even if the app is bypassed.",
      "Money only moves inside audited server-side functions — never from your phone.",
      "Identity documents are stored privately and opened only through short-lived links, by you or by the person reviewing your application.",
      "No system is perfect. If you find a problem, please tell us at " +
        contact.email +
        " and we will treat it seriously.",
    ],
  },
];

/**
 * The policy in the reader's language, plus a note when she is not reading the
 * checked version. Section-by-section fallback, same reasoning as the FAQs.
 */
export function privacyFor(language: Language): {
  readonly sections: readonly PolicySection[];
  readonly translationNote: string | null;
} {
  if (language !== "sw") return { sections: PRIVACY_SECTIONS, translationNote: null };
  const bySwId = new Map(PRIVACY_SECTIONS_SW.map((s) => [s.id, s]));
  return {
    sections: PRIVACY_SECTIONS.map((english) => bySwId.get(english.id) ?? english),
    translationNote: PRIVACY_TRANSLATION_NOTE_SW,
  };
}
