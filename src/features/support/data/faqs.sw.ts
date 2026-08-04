import { env } from "@/config/env";
import { contact } from "@/config/contact";
import type { Language } from "@/i18n";
import type { Faq } from "./faqs";

const { currency, baseFare, perKm, perMin, bookingFee, cancellationFee } = env.pricing;

/**
 * Kiswahili answers to the same questions, in the same order and under the
 * same ids as `faqs.ts`. Kept beside the English rather than inside the
 * dictionary because these are paragraphs, not labels — and because the fare
 * figures have to come from the live pricing config here too, or the Swahili
 * page would quote prices the English one has moved past.
 *
 * `faqsFor()` in `faqs.ts` checks the two lists answer the same ids.
 */
export const FAQS_SW: readonly Faq[] = [
  {
    id: "female-only",
    question: "Nitajuaje kwamba dereva wangu ni mwanamke?",
    answer:
      "Kila dereva anathibitishwa kabla hajabeba abiria hata mmoja: kitambulisho cha serikali, picha yake inayolinganishwa nacho, leseni yake na nyaraka za gari — vyote hukaguliwa na timu yetu. Mfumo wenyewe humpa safari dereva ambaye wasifu wake umeonyeshwa ni mwanamke na uthibitisho wake umepita — kwa hivyo akaunti isiyothibitishwa au ya mwanamume haiwezi kupangiwa wewe, hata kwa bahati mbaya.",
  },
  {
    id: "pickup-pin",
    question: "PIN ya kuanza safari ni nini?",
    answer:
      "Ni namba ya tarakimu 4 unayoonyeshwa wewe pekee. Dereva wako lazima aiweke kabla safari haijaanza, maana yake ni lazima awe amesimama na abiria sahihi — hivi ndivyo tunavyohakikisha huingii kwenye gari lisilo sahihi, na kwamba hakuna anayeweza kuanza safari kwa jina lako.",
  },
  {
    id: "trip-share",
    question: "Nawezaje kushiriki safari yangu na mtu?",
    answer:
      "Fungua safari yako inayoendelea kisha gusa HerShare. Hiyo hutengeneza kiungo ambacho mtu yeyote anaweza kufungua — bila akaunti — kikionyesha dereva wako, gari na ulipo moja kwa moja hadi safari itakapoisha. Ongeza watu wa dharura kwenye wasifu wako, nao ndio wa kwanza tunaowafikia ukipiga kengele ya hatari.",
  },
  {
    id: "sos",
    question: "Nini hutokea nikibonyeza SOS?",
    answer: `Tunarekodi tukio kwenye safari yako pamoja na mahali ulipo hasa, tunaarifu watu wako wa dharura, na tunaipeleka kwa timu yetu ya usalama ikaguliwe. Tafadhali elewa hii si nini: haikupigii polisi. Ukiwa hatarini papo hapo, piga ${contact.emergencyNumber} kwanza — kisha bonyeza SOS ili tuwe na kumbukumbu.`,
  },
  {
    id: "fare",
    question: "Nauli yangu hupigwaje hesabu?",
    answer: `Safari huanzia ${currency} ${baseFare}, pamoja na ${currency} ${perKm} kwa kila kilomita na ${currency} ${perMin} kwa kila dakika, na ada ya kuagiza ya ${currency} ${bookingFee}. Unaona makadirio kamili kabla ya kuthibitisha, na kiasi cha mwisho hupigwa hesabu kwenye seva safari inapokamilika — kamwe si kwenye simu yako, ili kisiweze kubadilishwa.`,
  },
  {
    id: "cancel",
    question: "Naweza kughairi? Kuna gharama?",
    answer: `Unaweza kughairi wakati wowote kabla safari haijaanza. Dereva akishakubali na yuko njiani, ada ya kughairi ya ${currency} ${cancellationFee} inaweza kutozwa — tayari ametumia mafuta na muda kuja kwako. Ghairi kabla dereva hajakubali na hakuna gharama yoyote.`,
  },
  {
    id: "wallet",
    question: "Pochi inafanyaje kazi?",
    answer:
      "Ongeza pesa kwenye pochi yako na safari hulipwa kutoka kwenye salio moja kwa moja. Kila mwendo — kuongeza pesa, malipo ya safari, marejesho, malipo kwa madereva — huandikwa na seva katika muamala mmoja, kwa hivyo salio lako na historia yako daima hukubaliana.",
  },
  {
    id: "schedule",
    question: "Naweza kuagiza safari ya baadaye?",
    answer:
      "Ndiyo. Kwenye hatua za kuagiza, chagua Panga wakati badala ya kusafiri sasa hivi kisha chagua saa. Unaweza pia kuongeza vituo njiani, na makadirio ya nauli yatajumuisha vituo hivyo.",
  },
  {
    id: "promo",
    question: "Kodi za ofa na kualika marafiki hufanyaje kazi?",
    answer:
      "Weka kodi kwenye hatua ya kuthibitisha na punguzo litatumika ukithibitisha. Kodi yako ya kualika iko kwenye wasifu wako — rafiki akijisajili nayo na kumaliza safari yake ya kwanza, nyote wawili mnapata pesa kwenye pochi. Punguzo huthibitishwa kwenye seva, kwa hivyo kodi iliyokwisha muda au iliyotumika hadi mwisho haitatumika tu.",
  },
  {
    id: "lost-item",
    question: "Nimesahau kitu ndani ya gari.",
    answer:
      "Fungua safari kwenye historia yako kisha tumia Ripoti tatizo hapo chini — tuambie ni safari ipi na uliacha nini. Tunaweza kumfikia dereva wako kwa niaba yako; namba yake halisi inabaki siri, na yako inabaki siri kwake.",
  },
  {
    id: "become-driver",
    question: "Nawezaje kuwa dereva wa HeRide?",
    answer:
      "Gusa “Kuwa dereva” kwenye wasifu wako. Utahitaji kitambulisho cha taifa, leseni halali ya udereva, usajili wa gari lako na bima, na picha yako kwa ukaguzi wa utambulisho. Maombi hukaguliwa na mtu, si mashine, na tutakuambia kinachokosekana badala ya kukukatalia kimya kimya.",
  },
  {
    id: "account",
    question: "Nawezaje kubadilisha maelezo yangu au kufuta akaunti?",
    answer:
      "Jina, namba ya simu na watu wa dharura vyote vinaweza kuhaririwa kwenye wasifu wako. Kufuta akaunti yako na data iliyoambatanishwa nayo, tutumie barua pepe kutoka anwani iliyo kwenye akaunti yako nasi tutathibitisha kabla ya chochote kuondolewa.",
  },
];

/** Which language a page should read the FAQs in. */
export type FaqLanguage = Language;
