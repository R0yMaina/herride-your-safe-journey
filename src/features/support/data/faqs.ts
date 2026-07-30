import { env } from "@/config/env";
import { contact } from "@/config/contact";

export interface Faq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

const { currency, baseFare, perKm, perMin, bookingFee, cancellationFee } = env.pricing;

/**
 * The questions a rider actually arrives with, answered from how the app really
 * behaves — fares quote the live pricing config rather than hardcoded numbers,
 * so this page can't drift out of step with what she is charged.
 */
export const FAQS: readonly Faq[] = [
  {
    id: "female-only",
    question: "How do I know my driver is a woman?",
    answer:
      "Every driver is verified before she can take a single trip: a government ID, a selfie matched against it, her licence and her vehicle papers are each reviewed by our team. The database itself will only offer a ride to a driver whose profile is marked female and whose verification has passed — so an unverified or male account cannot be matched to you, even by mistake.",
  },
  {
    id: "pickup-pin",
    question: "What is the pickup PIN?",
    answer:
      "A 4-digit code shown only to you. Your driver has to enter it before the trip can start, which means she has to be standing with the right passenger — it is how we make sure you never get into the wrong car, and that nobody can start a trip in your name.",
  },
  {
    id: "trip-share",
    question: "How do I share my trip with someone?",
    answer:
      "Open your active trip and tap HerShare. That creates a link anyone can open — no account needed — showing your driver, vehicle and live position until the trip ends. Add trusted contacts in your profile and they are the first people we reach if you raise an alarm.",
  },
  {
    id: "sos",
    question: "What happens when I press SOS?",
    answer: `We record an incident against your trip with your exact location, alert your trusted contacts, and flag it to our safety team for review. Please understand what this is not: it does not call the police for you. If you are in immediate danger, call ${contact.emergencyNumber} first — then press SOS so we have the record.`,
  },
  {
    id: "fare",
    question: "How is my fare worked out?",
    answer: `A ride starts at ${currency} ${baseFare}, plus ${currency} ${perKm} per kilometre and ${currency} ${perMin} per minute, with a ${currency} ${bookingFee} booking fee. You see the full estimate before you confirm, and the final amount is calculated on the server when the trip completes — never on your phone, so it cannot be tampered with.`,
  },
  {
    id: "cancel",
    question: "Can I cancel? Is there a charge?",
    answer: `You can cancel any time before the trip starts. Once a driver has accepted and is on her way, a ${currency} ${cancellationFee} cancellation fee may apply — she has already spent fuel and time coming to you. Cancel before a driver accepts and there is no charge at all.`,
  },
  {
    id: "wallet",
    question: "How does the wallet work?",
    answer:
      "Top up your wallet and rides are paid from the balance automatically. Every movement — top-ups, ride payments, refunds, driver payouts — is written by the server in a single transaction, so your balance and your history always agree.",
  },
  {
    id: "schedule",
    question: "Can I book a ride for later?",
    answer:
      "Yes. In the booking flow, choose Schedule instead of riding now and pick a time. You can also add stops along the way, and the fare estimate updates to include them.",
  },
  {
    id: "promo",
    question: "How do promo codes and referrals work?",
    answer:
      "Enter a code at the confirmation step and the discount is applied when you confirm. Your own referral code is in your profile — when a friend signs up with it and finishes her first trip, you both get wallet credit. Discounts are validated on the server, so a code that has expired or been used up simply won't apply.",
  },
  {
    id: "lost-item",
    question: "I left something in the car.",
    answer:
      "Open the trip in your ride history and use Report an issue below — tell us which trip and what you left. We can reach your driver on your behalf; her real number stays private, and yours stays private from her.",
  },
  {
    id: "become-driver",
    question: "How do I drive with HeRide?",
    answer:
      "Tap “Become a driver” in your profile. You will need a national ID, a valid driving licence, your vehicle registration and insurance, and a selfie for the identity check. Applications are reviewed by a person, not a script, and we will tell you what is missing rather than silently rejecting you.",
  },
  {
    id: "account",
    question: "How do I change my details or delete my account?",
    answer:
      "Name, phone and trusted contacts are all editable in your profile. To delete your account and the data attached to it, email us from the address on your account and we will confirm before anything is removed.",
  },
];
