export type CanonicalLocation = {
  id: string;
  canonicalName: string; // Exact match against DB 'country' column
  aliases: string[];     // Used for front-end typed search in Comboboxes
  regionGroup: string;   // High-level grouping for Map/Browse UI
};

export const DIASPORA_COUNTRIES: CanonicalLocation[] = [
  // ── ALBANIAN LANDS ───────────────────────────────────────────────
  { id: "AL", canonicalName: "Albania", aliases: ["shqipëri", "shqiperi", "shqipëria", "shqiperia", "albanie", "albanien"], regionGroup: "Albanian Lands" },
  { id: "XK", canonicalName: "Kosovo", aliases: ["kosovo", "kosova", "kosovë", "kosove"], regionGroup: "Albanian Lands" },
  { id: "MK", canonicalName: "North Macedonia", aliases: ["macedonia", "maqedonia", "maqedonia e veriut", "north mac", "n. macedonia"], regionGroup: "Albanian Lands" },
  { id: "ME", canonicalName: "Montenegro", aliases: ["mali i zi", "crna gora"], regionGroup: "Albanian Lands" },
  { id: "RS", canonicalName: "Serbia", aliases: ["serbi", "srbija", "presheva", "bujanovac", "medvegja"], regionGroup: "Albanian Lands" },

  // ── TURKEY / ANATOLIA ────────────────────────────────────────────
  { id: "TR", canonicalName: "Turkey", aliases: ["türkiye", "turkiye", "turqi", "turqia"], regionGroup: "Turkey / Anatolia" },

  // ── BALKANS & SOUTHEAST EUROPE ───────────────────────────────────
  { id: "GR", canonicalName: "Greece", aliases: ["greqi", "greqia", "hellas", "yunanistan"], regionGroup: "Balkans & Southeast Europe" },
  { id: "BG", canonicalName: "Bulgaria", aliases: ["bullgari", "bullgaria"], regionGroup: "Balkans & Southeast Europe" },
  { id: "RO", canonicalName: "Romania", aliases: ["rumani", "rumania"], regionGroup: "Balkans & Southeast Europe" },
  { id: "HR", canonicalName: "Croatia", aliases: ["hrvatska", "kroaci"], regionGroup: "Balkans & Southeast Europe" },
  { id: "SI", canonicalName: "Slovenia", aliases: ["slovenija", "slloveni"], regionGroup: "Balkans & Southeast Europe" },
  { id: "HU", canonicalName: "Hungary", aliases: ["magyarország", "hungari"], regionGroup: "Balkans & Southeast Europe" },

  // ── WESTERN EUROPE ───────────────────────────────────────────────
  { id: "IT", canonicalName: "Italy", aliases: ["italia", "itali"], regionGroup: "Western Europe" },
  { id: "DE", canonicalName: "Germany", aliases: ["deutschland", "gjermani", "gjermania"], regionGroup: "Western Europe" },
  { id: "CH", canonicalName: "Switzerland", aliases: ["suisse", "schweiz", "svizzera", "zvicër", "zvicer", "zvicra", "svizra"], regionGroup: "Western Europe" },
  { id: "AT", canonicalName: "Austria", aliases: ["österreich", "austri"], regionGroup: "Western Europe" },
  { id: "FR", canonicalName: "France", aliases: ["francë", "franca"], regionGroup: "Western Europe" },
  { id: "BE", canonicalName: "Belgium", aliases: ["belgique", "belgië", "belgjikë", "belgjika"], regionGroup: "Western Europe" },
  { id: "NL", canonicalName: "Netherlands", aliases: ["holland", "nederland", "holanda", "holandë"], regionGroup: "Western Europe" },
  { id: "LU", canonicalName: "Luxembourg", aliases: ["luxemburg", "luksemburg"], regionGroup: "Western Europe" },
  { id: "GB", canonicalName: "United Kingdom", aliases: ["uk", "u.k.", "britain", "great britain", "england", "mbretëria e bashkuar", "mbreteria e bashkuar", "britania", "britania e madhe"], regionGroup: "Western Europe" },
  { id: "IE", canonicalName: "Ireland", aliases: ["éire", "irlandë", "irlanda"], regionGroup: "Western Europe" },
  { id: "ES", canonicalName: "Spain", aliases: ["españa", "spanjë", "spanje"], regionGroup: "Western Europe" },
  { id: "PT", canonicalName: "Portugal", aliases: ["portugali"], regionGroup: "Western Europe" },

  // ── NORDICS ──────────────────────────────────────────────────────
  { id: "SE", canonicalName: "Sweden", aliases: ["sverige", "suedi", "suedia"], regionGroup: "Nordics" },
  { id: "NO", canonicalName: "Norway", aliases: ["norge", "norvegji"], regionGroup: "Nordics" },
  { id: "DK", canonicalName: "Denmark", aliases: ["danmark", "danimarkë", "danimarke"], regionGroup: "Nordics" },
  { id: "FI", canonicalName: "Finland", aliases: ["suomi", "finlandë", "finlande"], regionGroup: "Nordics" },

  // ── NORTH AMERICA ────────────────────────────────────────────────
  { id: "US", canonicalName: "United States", aliases: ["united states of america", "usa", "u.s.", "us", "america", "amerikë", "amerike", "shba", "shtetet e bashkuara"], regionGroup: "North America" },
  { id: "CA", canonicalName: "Canada", aliases: ["kanada", "kanadaja"], regionGroup: "North America" },

  // ── EASTERN EUROPE ───────────────────────────────────────────────
  { id: "CZ", canonicalName: "Czechia", aliases: ["czech republic", "çeki", "ceki"], regionGroup: "Eastern Europe" },
  { id: "PL", canonicalName: "Poland", aliases: ["polska", "poloni"], regionGroup: "Eastern Europe" },

  // ── OCEANIA ──────────────────────────────────────────────────────
  { id: "AU", canonicalName: "Australia", aliases: ["australi"], regionGroup: "Oceania" },
  { id: "NZ", canonicalName: "New Zealand", aliases: ["nz", "zelandë e re", "zelanda e re"], regionGroup: "Oceania" },

  // ── LATIN AMERICA ────────────────────────────────────────────────
  { id: "AR", canonicalName: "Argentina", aliases: ["argjentina"], regionGroup: "Latin America" },
  { id: "BR", canonicalName: "Brazil", aliases: ["brasil", "brazili"], regionGroup: "Latin America" },
  { id: "CL", canonicalName: "Chile", aliases: ["kili"], regionGroup: "Latin America" },
  { id: "UY", canonicalName: "Uruguay", aliases: ["uruguai"], regionGroup: "Latin America" },
  { id: "MX", canonicalName: "Mexico", aliases: ["méxico", "meksikë", "meksike"], regionGroup: "Latin America" },

  // ── MIDDLE EAST / GULF ───────────────────────────────────────────
  { id: "AE", canonicalName: "United Arab Emirates", aliases: ["uae", "emiratet e bashkuara arabe"], regionGroup: "Middle East / Gulf" },
  { id: "QA", canonicalName: "Qatar", aliases: ["katar"], regionGroup: "Middle East / Gulf" },

  // ── AFRICA ───────────────────────────────────────────────────────
  { id: "ZA", canonicalName: "South Africa", aliases: ["rsa", "afrika e jugut"], regionGroup: "Africa" },
  { id: "EG", canonicalName: "Egypt", aliases: ["misr", "egjipt"], regionGroup: "Africa" },
];
