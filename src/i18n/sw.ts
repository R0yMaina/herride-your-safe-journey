import type { Dictionary } from "./en";

/**
 * Kiswahili copy, in the register Kenyan riders actually use rather than
 * textbook Swahili: "dereva" not "mwendeshaji", "nauli" for fare, "pesa" for
 * money. Loanwords that everyone says in English on a phone screen are left
 * alone — nobody in Nairobi asks for a "kadi ya mkopo".
 *
 * Typed as `Dictionary`, so a key added to `en.ts` and forgotten here is a
 * build error, not a rider staring at English she cannot read.
 */
export const sw: Dictionary = {
  nav: {
    home: "Nyumbani",
    rides: "Safari",
    wallet: "Pochi",
    profile: "Wasifu",
  },

  common: {
    loading: "Inapakia…",
    cancel: "Ghairi",
    back: "Rudi",
    retry: "Jaribu tena",
    close: "Funga",
    somethingWentWrong: "Kuna hitilafu imetokea",
  },

  home: {
    greeting: "Unaenda wapi leo?",
    searchPlaceholder: "Tafuta unakoenda",
    savedPlaces: "Sehemu ulizohifadhi",
    home: "Nyumbani",
    work: "Kazini",
    driversNearby: "Madereva {count} karibu nawe",
    noDriversNearby: "Hakuna dereva karibu kwa sasa",
  },

  booking: {
    title: "Agiza safari",
    pickup: "Mahali pa kuchukuliwa",
    destination: "Unakoenda",
    stop: "Kituo cha {number}",
    chooseRide: "Chagua gari lako",
    preferences: "Mapendeleo",
    schedule: "Panga wakati",
    confirm: "Thibitisha",
    distance: "Umbali",
    duration: "Muda",
    ride: "Gari",
    estimatedFare: "Nauli inayokadiriwa",
    now: "Sasa hivi",
    minutesAway: "Dakika {count} kufika",
    bookNow: "Agiza sasa",
    surgeTitle: "Nauli ya {multiplier}",
    surgeBody:
      "Kuna abiria wengi kuliko madereva karibu nawe kwa sasa. Kiwango hiki kitafungwa ukiagiza, hata kikipanda ukiwa bado unafikiria.",
    heavyTraffic:
      "Msongamano mkubwa — takriban dakika {minutes} zaidi ya kawaida. Nauli yako inajumuisha muda huo wa ziada.",
  },

  trip: {
    findingDriver: "Tunakutafutia dereva",
    onYourWay: "Uko njiani",
    tripComplete: "Asante kwa kusafiri nasi",
    cancelled: "Safari imeghairiwa",
    route: "Njia",
    pickupPin: "PIN yako ya kuanza safari",
    pickupPinHelp:
      "Mpe dereva namba hii tu ukishaingia kwenye gari sahihi salama — safari haiwezi kuanza bila hiyo.",
    emergencySos: "Dharura — SOS",
    shareTrip: "Shiriki safari",
    cancelRide: "Ghairi safari",
    backToHome: "Rudi nyumbani",
    messageDriver: "Tuma ujumbe kwa dereva",
    fareCharged: "Nauli iliyotozwa",
    status: {
      requested: "Tunatafuta dereva",
      matched: "Umepatikana dereva",
      accepted: "Dereva amepangwa",
      arrived: "Dereva amefika",
      in_progress: "Safari inaendelea",
      completed: "Imekamilika",
      cancelled: "Imeghairiwa",
    },
  },

  receipt: {
    title: "Risiti",
    share: "Shiriki",
    baseFare: "Nauli ya msingi",
    distance: "Umbali",
    distanceWith: "Umbali (km {km})",
    time: "Muda",
    timeWith: "Muda (dakika {minutes})",
    bookingFee: "Ada ya kuagiza",
    busyPeriod: "Kipindi cha shughuli nyingi ({multiplier})",
    promo: "Ofa {code}",
    promoGeneric: "Punguzo la ofa",
    waiting: "Kusubiri (dakika {minutes})",
    minimumFareAdjustment: "Marekebisho ya nauli ya chini",
    fareAdjustment: "Marekebisho ya nauli",
    cancellationFee: "Ada ya kughairi",
    cancellationNote:
      "Umetozwa kwa sababu dereva alikuwa tayari njiani kuja kwako. Pesa hii ni yake, si ya HeRide.",
    totalCharged: "Jumla uliyotozwa",
    tip: "Zawadi kwa dereva wako",
    unavailable: "Risiti haipatikani",
    copied: "Risiti imenakiliwa",
  },

  rides: {
    eyebrow: "Historia",
    title: "Safari zako",
    subtitle: "Kila safari, ikifuatiliwa na kupewa risiti.",
    active: "Zinazoendelea",
    past: "Zilizopita",
    noActive: "Hakuna safari inayoendelea",
    noActiveHelp: "Agiza safari kutoka Nyumbani ili ionekane hapa.",
    noPast: "Bado hakuna safari zilizopita",
    noPastHelp: "Safari zilizokamilika na zilizoghairiwa zitaonekana hapa.",
    receipt: "Risiti",
  },

  wallet: {
    title: "Pochi",
    balance: "Salio",
    topUp: "Ongeza pesa",
    transactions: "Miamala",
    noTransactions: "Bado hakuna miamala",
  },

  profile: {
    title: "Wasifu",
    account: "Akaunti",
    preferences: "Mapendeleo",
    rideHistory: "Historia ya safari",
    rideHistorySub: "Safari zako, risiti na alama",
    becomeDriver: "Kuwa dereva",
    becomeDriverSub: "Wanawake waliothibitishwa pekee — pata kipato kwa masharti yako",
    walletPayments: "Pochi na malipo",
    walletPaymentsSub: "Salio, kuongeza pesa na kutoa",
    identityVerification: "Uthibitisho wa utambulisho",
    identityVerified: "Utambulisho wako umethibitishwa",
    identityPending: "Nyaraka zako zinakaguliwa",
    identityUnverified: "Thibitisha wewe ni nani kwa kitambulisho na picha yako",
    safetySuite: "Usalama",
    safetySuiteSub: "SOS, kushiriki safari moja kwa moja na watu wa dharura",
    notifications: "Arifa",
    helpSupport: "Msaada",
    helpSupportSub: "Maswali, ripoti tatizo, wasiliana nasi",
    privacy: "Faragha",
    privacySub: "Tunachokusanya, na haki zako juu yake",
    signOut: "Toka",
    signOutSub: "Ondoka kwenye kifaa hiki",
    language: "Lugha",
    languageSub: "Kiingereza au Kiswahili",
  },

  verification: {
    title: "Thibitisha utambulisho wako",
    subtitle: "Ili kila mwanamke ndani ya gari ajue mwenzake ni nani.",
    verified: "Umethibitishwa",
    verifiedBody: "Asante — akaunti yako imethibitishwa kikamilifu. Hakuna kingine cha kufanya.",
    underReview: "Nyaraka zinakaguliwa",
    underReviewBody:
      "Mtu anaangalia picha zako. Kwa kawaida huchukua saa chache, na unaweza kuendelea kuagiza safari wakati huo.",
    selfieLabel: "Picha yako, sasa hivi",
    idLabel: "Kitambulisho chako cha taifa au pasipoti",
    idNumberLabel: "Namba ya kitambulisho (si lazima)",
    submit: "Wasilisha kwa ukaguzi",
    submitting: "Inawasilishwa…",
    ridesRemaining: "Unaweza kuagiza safari {count} zaidi kabla hii haijawa lazima.",
    ridesRemainingOne: "Unaweza kuagiza safari 1 zaidi kabla hii haijawa lazima.",
    required: "Sasa unahitaji kuthibitisha utambulisho kabla ya kuagiza tena.",
    photoNote:
      "Zinahifadhiwa kwa siri, zinaonwa na mtu anayezikagua pekee, na zinafutwa ukifuta akaunti yako. Hazionyeshwi kamwe kwa madereva au abiria wengine.",
  },

  driver: {
    online: "Uko mtandaoni",
    offline: "Uko nje ya mtandao",
    onlineSub: "Unapokea maombi ya safari karibu nawe",
    offlineSub: "Ingia mtandaoni ili upokee maombi",
    activeTrip: "Safari inayoendelea",
    arrived: "Nimefika",
    startTrip: "Anza safari",
    completeTrip: "Maliza safari",
    messageRider: "Tuma ujumbe kwa abiria",
    toYourRider: "Kwenda kwa abiria wako",
    toDestination: "Kwenda anakoenda",
    findingRoute: "Inatafuta njia…",
    waitingForLocation: "Inasubiri mahali ulipo…",
    then: "Kisha: {instruction}",
  },
};
