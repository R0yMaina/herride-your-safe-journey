import { contact } from "@/config/contact";
import type { Language } from "@/i18n";
import type { PolicySection } from "./privacy";

/**
 * Kiswahili privacy policy, section for section under the same ids.
 *
 * This is a translation of the English text, not a separate policy: both say
 * the same thing, and the English remains the version to check against if the
 * two ever appear to differ. It has not been through a Kenyan data-protection
 * lawyer in Kiswahili — see the note rendered at the foot of the page.
 */
export const PRIVACY_SECTIONS_SW: readonly PolicySection[] = [
  {
    id: "who",
    heading: "Sisi ni nani",
    body: [
      `HeRide ni huduma ya kuagiza usafiri kwa wanawake pekee inayofanya kazi nchini Kenya. Sisi ndio wadhibiti wa taarifa zilizoelezwa hapa, na unaweza kutufikia kupitia ${contact.email}.`,
    ],
  },
  {
    id: "what",
    heading: "Tunachokusanya",
    body: [
      "Kutoka kwa abiria: jina lako, namba ya simu, barua pepe, na jinsia unayotuambia unapojisajili. Mahali unapochukuliwa na unapoenda, njia iliyotumika, ulicholipa, na ujumbe wowote unaomtumia dereva wako kupitia programu.",
      "Kwa uthibitisho wa abiria: picha ya uso wako na ya kitambulisho chako cha taifa au pasipoti, na hiari namba ya kitambulisho. Hizi huonwa na mtu anayezikagua pekee, hazionyeshwi kamwe kwa madereva au abiria wengine, na hufutwa ukifuta akaunti yako.",
      "Kutoka kwa madereva: yote yaliyo hapo juu, pamoja na kitambulisho cha taifa, leseni ya udereva, usajili wa gari na picha ya uso. Tunachukua picha mpya mara kwa mara kuthibitisha kwamba anayeendesha bado ni wewe.",
      "Kutoka kwenye kifaa chako: mahali ulipo unapotumia programu. Kwa madereva, mahali ulipo ukiwa mtandaoni — hivi ndivyo abiria walio karibu nawe wanavyoweza kupangiwa wewe.",
      "Hatukusanyi anwani zako, maktaba yako ya picha, wala chochote kutoka programu nyingine.",
    ],
  },
  {
    id: "why",
    heading: "Kwa nini tunakusanya",
    body: [
      "Kukupangia dereva, kupanga bei na kumaliza malipo ya safari, na kuwawezesha wewe na dereva wako kuwasiliana bila kubadilishana namba za simu.",
      "Kuhakikisha huduma inabaki ya wanawake pekee. Kuthibitisha utambulisho na jinsia ndio msingi mzima wa ahadi tunayotoa, na ndiyo sababu tunawaomba abiria na madereva sawa nyaraka ambazo huduma nyingi nyingi zisingeomba.",
      "Kujibu tukio la usalama. Ukipiga kengele ya hatari, mahali ulipo na maelezo ya safari yako huenda kwa watu wako wa dharura na kwa timu yetu ya usalama.",
      "Kutimiza matakwa ya kisheria — kumbukumbu za kodi, na kujibu amri halali ya kisheria.",
    ],
  },
  {
    id: "sharing",
    heading: "Nani anaziona",
    body: [
      "Dereva wako anaona jina lako la kwanza, mahali pa kukuchukua na unapoenda, na alama zako. Haoni kamwe namba yako ya simu.",
      "Wewe unaona jina la kwanza la dereva, picha yake, gari na alama zake. Huoni kamwe namba yake ya simu.",
      "Yeyote unayemtumia kiungo cha safari moja kwa moja anaona dereva wako, gari lake na ulipo hadi safari itakapoisha. Wewe unachagua lini kutuma.",
      "Watu wako wa dharura huwasiliwa tu ukipiga kengele ya hatari.",
      "Wasindikaji wetu: Supabase (hifadhidata na hifadhi) na Cloudflare (uenyeji). Utafutaji wa ramani na anwani huenda Mapbox, CARTO, Photon au Google kutegemea usanidi — hao hupokea viwianishi vya mahali, kamwe si utambulisho wako.",
      "Hatuuzi data yako. Hatuishiriki kwa matangazo.",
    ],
  },
  {
    id: "keeping",
    heading: "Tunaihifadhi kwa muda gani",
    body: [
      "Kumbukumbu za safari na malipo: huhifadhiwa kwa muda wote sheria ya kodi na uhasibu inavyotaka.",
      "Historia ya mahali kwa madereva walio nje ya mtandao: hufutwa baada ya siku 90.",
      "Ujumbe ndani ya programu: maudhui huondolewa baada ya siku 365.",
      "Viungo vya kushiriki safari: hufutwa wiki moja baada ya muda wake kuisha.",
      "Nyaraka za utambulisho wa madereva: huhifadhiwa muda wote unapoendesha nasi, na huondolewa akaunti yako ikifutwa.",
    ],
  },
  {
    id: "rights",
    heading: "Haki zako",
    body: [
      "Unaweza kuona na kusahihisha maelezo yako kwenye wasifu wako wakati wowote.",
      "Unaweza kufuta akaunti yako kutoka kwenye wasifu wako. Kufanya hivyo huharibu jina lako, namba ya simu, sehemu ulizohifadhi, watu wako wa dharura, maudhui ya ujumbe na nyaraka zozote za utambulisho. Safari na malipo yako hubaki bila jina lako, kwa sababu tunatakiwa kisheria kuhifadhi kumbukumbu za kifedha — hayawezi tena kufuatiliwa hadi kwako.",
      "Tutakuomba utoe kwanza salio lolote lililo kwenye pochi yako. Pesa hiyo ni yako, na kuifuta pamoja na data yako isingekuwa faida ya faragha.",
      "Ukiamini tumeshughulikia data yako vibaya, unaweza kulalamika kwa Ofisi ya Kamishna wa Ulinzi wa Data nchini Kenya (ODPC).",
    ],
  },
  {
    id: "security",
    heading: "Tunavyoilinda",
    body: [
      "Kila jedwali hutekeleza sheria za ufikiaji kwa kila safu ndani ya hifadhidata, kwa hivyo akaunti moja haiwezi kusoma data ya nyingine hata programu ikipitwa.",
      "Pesa huhamishwa tu ndani ya vitendaji vya seva vinavyokaguliwa — kamwe si kutoka kwenye simu yako.",
      "Nyaraka za utambulisho huhifadhiwa kwa siri na hufunguliwa tu kupitia viungo vya muda mfupi, na wewe au na mtu anayekagua maombi yako.",
      "Hakuna mfumo ulio kamili. Ukipata tatizo, tafadhali tuambie kupitia " +
        contact.email +
        " nasi tutalichukulia kwa uzito.",
    ],
  },
];

/**
 * A translated legal notice is still a translation. The English text is the
 * one that has been checked, so the Swahili page says so rather than implying
 * both have equal standing.
 */
export const PRIVACY_TRANSLATION_NOTE_SW =
  "Tafsiri hii imetolewa kwa urahisi wako. Maandishi ya Kiingereza ndiyo ya kurejelewa iwapo tofauti yoyote itajitokeza.";

export type PrivacyLanguage = Language;
