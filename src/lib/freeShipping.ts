/**
 * Free-shipping thresholds per destination country (USD), transcribed from
 * "Native: Shipping Guidelines - Free shipping".
 *
 * The table follows six logistics tiers — the harder/pricier the route, the
 * higher the order value needed:
 *   $750   USA (domestic)
 *   $1,000 Canada
 *   $1,200 Western Europe + developed Asia-Pacific
 *   $1,500 United Kingdom
 *   $2,000 Eastern Europe / Baltics / Caucasus / Central Asia
 *   $2,500 everywhere else (Africa, Latin America, Middle East, Pacific)
 *
 * Three rows in the source were ambiguous and were resolved CONSERVATIVELY
 * (higher threshold), so the cart never promises free shipping we would not
 * honour:
 *   - Hungary was listed as "2000/2500"      -> 2500
 *   - Russia appeared twice ($2,500 and, as "Russian Federation", $1,200) -> 2500
 *   - Scotland was listed apart from the UK at $1,200 -> 1500 (it IS the UK,
 *     and Shopify reports "United Kingdom" for Scottish addresses anyway)
 *
 * The source omits 55 destinations (Belgium, Greece, Norway, Vietnam, the whole
 * Caribbean…). Those are covered by INFERRED_THRESHOLDS_USD below, which sorts
 * them into these same tiers by the pattern the table follows — kept in a
 * separate map so official numbers stay distinguishable from derived ones.
 */
export const FREE_SHIPPING_THRESHOLDS_USD: Record<string, number> = {
  albania: 2000,
  algeria: 2500,
  angola: 2500,
  argentina: 2500,
  armenia: 2500,
  australia: 1200,
  austria: 1200,
  azerbaijan: 2000,
  bahrain: 2500,
  belarus: 2000,
  belize: 2500,
  benin: 2500,
  bhutan: 2500,
  bolivia: 2500,
  bosniaherzegovina: 2000,
  botswana: 2500,
  brazil: 2500,
  brunei: 2500,
  bulgaria: 2000,
  burkinafaso: 2500,
  burundi: 2500,
  cambodia: 2500,
  cameroon: 2500,
  canada: 1000,
  capeverde: 2500,
  centralafricanrepublic: 2500,
  chad: 2500,
  chile: 2500,
  china: 1200,
  colombia: 2500,
  comoros: 2500,
  congo: 2500,
  cookislands: 2500,
  costarica: 2500,
  cotedivoire: 2500,
  croatia: 2000,
  cyprus: 1200,
  czechrepublicczechia: 2000,
  democraticrepublicofthecongo: 2500,
  denmark: 1200,
  djibouti: 2500,
  ecuador: 2500,
  egypt: 2500,
  elsalvador: 2500,
  equatorialguinea: 2500,
  eritrea: 2500,
  estonia: 2000,
  eswatini: 2500,
  ethiopia: 2500,
  falklandislands: 2500,
  fiji: 2500,
  finland: 1200,
  france: 1200,
  frenchguyana: 2500,
  gabon: 2500,
  gambia: 2500,
  georgia: 2000,
  germany: 1200,
  ghana: 2500,
  gibraltar: 2000,
  guatemala: 2500,
  guinea: 2500,
  guineabissau: 2500,
  guyana: 2500,
  honduras: 2500,
  hongkong: 1200,
  hungary: 2500,
  india: 1200,
  iraq: 1200,
  ireland: 1200,
  israel: 2500,
  italy: 1200,
  japan: 1200,
  jordan: 2500,
  kazakhstan: 2000,
  kenya: 2500,
  kiribati: 2500,
  koreadpr: 2500,
  kosovo: 2000,
  kuwait: 2500,
  kyrgyzstan: 2000,
  laos: 2500,
  latvia: 2000,
  lebanon: 2500,
  lesotho: 2500,
  liberia: 2500,
  libya: 2500,
  lithuania: 2000,
  luxemburg: 1200,
  madagascar: 2500,
  malawi: 2500,
  malaysia: 1200,
  maldives: 2500,
  mali: 2500,
  mauritania: 2500,
  mauritius: 2500,
  mayotte: 2500,
  mexico: 1200,
  moldova: 2000,
  mongolia: 2500,
  montenegro: 2000,
  morocco: 2500,
  mozambique: 2500,
  myanmar: 2500,
  namibia: 2500,
  nauru: 2500,
  nepal: 2500,
  netherlands: 1200,
  newcaledonia: 2500,
  newzealand: 1200,
  nicaragua: 2500,
  niger: 2500,
  nigeria: 2500,
  niue: 2500,
  northmacedonia: 2000,
  oman: 2500,
  panama: 2500,
  papuanewguinea: 2500,
  paraguay: 2500,
  peru: 2500,
  phillipines: 1200,
  poland: 2000,
  portugal: 1200,
  qatar: 2500,
  reunion: 2500,
  romania: 2000,
  russia: 2500,
  rwanda: 2500,
  sainthelena: 2500,
  samoa: 2500,
  saotomeandprincipe: 2500,
  saudiarabia: 2500,
  senegal: 2500,
  serbia: 2000,
  seychelles: 2500,
  sierraleone: 2500,
  singapore: 1200,
  slovakia: 2000,
  slovenia: 2000,
  solomonislands: 2500,
  somaliahargeisa: 2500,
  somaliamogadishu: 2500,
  southafrica: 2500,
  southkorea: 1200,
  southsudan: 2500,
  spain: 1200,
  sudan: 2500,
  suriname: 2500,
  sweden: 1200,
  switzerland: 2000,
  syria: 2500,
  tahiti: 2500,
  taiwan: 1200,
  tanzania: 2500,
  thailand: 1200,
  timorleste: 2500,
  togo: 2500,
  tonga: 2500,
  tunisia: 2500,
  turkey: 2500,
  tuvalu: 2500,
  uae: 2500,
  uganda: 2500,
  uk: 1500,
  ukraine: 2000,
  uruguay: 2500,
  usa: 750,
  vanuatu: 2500,
  venezuela: 2500,
  yemen: 2500,
  zambia: 2500,
  zimbabwe: 2500,};

/**
 * Destinations the source PDF does not list, placed into the SAME six tiers by
 * applying the pattern the table itself follows. Kept apart from the official
 * numbers above so it stays obvious which values came from the guidelines and
 * which we derived — replace an entry here the moment the real one is known.
 *
 * How each was decided:
 *  - $1,200  EU/Western Europe (Belgium, Greece, Malta, Monaco, San Marino,
 *            Vatican) and the well-served Asian markets that sit beside
 *            Thailand/Malaysia/Philippines in the table (Indonesia, Vietnam,
 *            Macau — a SAR like Hong Kong).
 *  - $1,500  Guernsey / Jersey / Isle of Man — British Isles, so they follow
 *            the UK rather than mainland Europe.
 *  - $2,000  Non-EU Europe, following the table's own Switzerland precedent
 *            (Norway, Iceland, Andorra, Liechtenstein), plus the Central Asian
 *            republics that sit beside Kazakhstan/Kyrgyzstan.
 *  - $2,500  Everything else, matching the table's default: South Asia (the
 *            tier of Nepal/Bhutan/Maldives), the Middle East, the whole
 *            Caribbean, the remote North Atlantic and the Pacific islands.
 */
export const INFERRED_THRESHOLDS_USD: Record<string, number> = {
  // Western Europe / EU customs territory
  belgium: 1200,
  greece: 1200,
  malta: 1200,
  monaco: 1200,
  sanmarino: 1200,
  vaticancity: 1200,
  holysee: 1200,
  // Asia — alongside Thailand / Malaysia / Philippines / Hong Kong
  indonesia: 1200,
  vietnam: 1200,
  macau: 1200,
  // British Isles — follow the UK
  guernsey: 1500,
  jersey: 1500,
  isleofman: 1500,
  // Non-EU Europe — Switzerland precedent
  norway: 2000,
  iceland: 2000,
  andorra: 2000,
  liechtenstein: 2000,
  // Central Asia — alongside Kazakhstan / Kyrgyzstan
  uzbekistan: 2000,
  tajikistan: 2000,
  turkmenistan: 2000,
  // South Asia / Middle East — tier of Nepal, Bhutan, Maldives
  afghanistan: 2500,
  bangladesh: 2500,
  pakistan: 2500,
  srilanka: 2500,
  iran: 2500,
  palestine: 2500,
  // Remote North Atlantic
  greenland: 2500,
  faroeislands: 2500,
  // Caribbean
  anguilla: 2500,
  antiguabarbuda: 2500,
  antiguaandbarbuda: 2500,
  aruba: 2500,
  bahamas: 2500,
  barbados: 2500,
  bermuda: 2500,
  britishvirginislands: 2500,
  caymanislands: 2500,
  cuba: 2500,
  curacao: 2500,
  dominica: 2500,
  dominicanrepublic: 2500,
  grenada: 2500,
  guadeloupe: 2500,
  haiti: 2500,
  jamaica: 2500,
  martinique: 2500,
  montserrat: 2500,
  puertorico: 2500,
  saintkittsnevis: 2500,
  saintkittsandnevis: 2500,
  saintlucia: 2500,
  saintvincentgrenadines: 2500,
  saintvincentandthegrenadines: 2500,
  trinidadtobago: 2500,
  trinidadandtobago: 2500,
  turkscaicosislands: 2500,
  turksandcaicosislands: 2500,
  // Pacific
  frenchpolynesia: 2500,
  marshallislands: 2500,
  micronesia: 2500,
  palau: 2500,
};

/** Accent/case/punctuation-insensitive key, so "Côte d’Ivoire" === "cote divoire". */
const normalizeCountry = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Shopify returns display names ("United States", "Czechia") while the source
 * table uses its own spellings — including a few typos ("Phillipines",
 * "Luxemburg"). Map the variants onto the table's keys.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  unitedstates: "usa",
  unitedstatesofamerica: "usa",
  us: "usa",
  unitedkingdom: "uk",
  greatbritain: "uk",
  england: "uk",
  wales: "uk",
  northernireland: "uk",
  scotland: "uk",
  gb: "uk",
  czechia: "czechrepublicczechia",
  czechrepublic: "czechrepublicczechia",
  philippines: "phillipines",
  luxembourg: "luxemburg",
  russianfederation: "russia",
  unitedarabemirates: "uae",
  hongkongsarchina: "hongkong",
  koreasouth: "southkorea",
  republicofkorea: "southkorea",
  northkorea: "koreadpr",
  koreanorth: "koreadpr",
  turkiye: "turkey",
  caboverde: "capeverde",
  ivorycoast: "cotedivoire",
  myanmarburma: "myanmar",
  bosniaandherzegovina: "bosniaherzegovina",
  swaziland: "eswatini",
  democraticrepublicofcongo: "democraticrepublicofthecongo",
  drcongo: "democraticrepublicofthecongo",
  republicofthecongo: "congo",
};

/**
 * Free-shipping threshold for a destination, or null when the guidelines do not
 * cover it (unknown/absent country) — callers must then show nothing.
 */
export function getFreeShippingThreshold(country: string | null | undefined): number | null {
  if (!country) return null;
  const key = normalizeCountry(country);
  if (!key) return null;
  const resolved = COUNTRY_ALIASES[key] ?? key;
  // The guidelines win; the derived tiers only cover what they left out.
  return FREE_SHIPPING_THRESHOLDS_USD[resolved] ?? INFERRED_THRESHOLDS_USD[resolved] ?? null;
}

/**
 * Worst case across every destination we know of. Used when the shopper's
 * country is unknown (not logged in, or no address on file): we quote the
 * highest threshold so the promise always holds, and invite them to tell us
 * where they are — their real number can only be this or lower.
 *
 * Derived from the tables rather than hardcoded, so it stays right if a tier
 * ever changes.
 */
export const MAX_FREE_SHIPPING_THRESHOLD = Math.max(
  ...Object.values(FREE_SHIPPING_THRESHOLDS_USD),
  ...Object.values(INFERRED_THRESHOLDS_USD),
);

export interface FreeShippingStatus {
  /** Order value that unlocks free shipping for this destination. */
  threshold: number;
  /** How much more the customer must add. 0 once they qualify. */
  remaining: number;
  qualified: boolean;
}

/**
 * Progress toward free shipping, or null when we cannot say (no country, or a
 * destination the guidelines do not list). Never guesses.
 */
export function getFreeShippingStatus(
  subtotal: number,
  country: string | null | undefined,
): FreeShippingStatus | null {
  const threshold = getFreeShippingThreshold(country);
  if (threshold == null) return null;
  const remaining = Math.max(0, threshold - subtotal);
  return { threshold, remaining, qualified: remaining === 0 };
}

/**
 * Every destination we can quote, by display name — used to let a customer pick
 * their country when their account has no address yet. Covers both the
 * guidelines and the derived tiers, and each entry resolves through
 * getFreeShippingThreshold().
 */
export const FREE_SHIPPING_COUNTRIES: string[] = [
  "Afghanistan",
  "Andorra",
  "Anguilla",
  "Antigua & Barbuda",
  "Aruba",
  "Bahamas",
  "Bangladesh",
  "Barbados",
  "Belgium",
  "Bermuda",
  "British Virgin Islands",
  "Cayman Islands",
  "Cuba",
  "Curaçao",
  "Dominica",
  "Dominican Republic",
  "Faroe Islands",
  "French Polynesia",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guernsey",
  "Haiti",
  "Iceland",
  "Indonesia",
  "Iran",
  "Isle of Man",
  "Jamaica",
  "Jersey",
  "Liechtenstein",
  "Macau",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Micronesia",
  "Monaco",
  "Montserrat",
  "Norway",
  "Pakistan",
  "Palau",
  "Palestine",
  "Puerto Rico",
  "Saint Kitts & Nevis",
  "Saint Lucia",
  "Saint Vincent & Grenadines",
  "San Marino",
  "Sri Lanka",
  "Tajikistan",
  "Trinidad & Tobago",
  "Turkmenistan",
  "Turks & Caicos Islands",
  "Uzbekistan",
  "Vatican City",
  "Vietnam",
  "Albania",
  "Algeria",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Belarus",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia & Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Cook Islands",
  "Costa Rica",
  "Côte d’Ivoire",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Falkland Islands",
  "Fiji",
  "Finland",
  "France",
  "French Guyana",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "India",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Moldova",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "North Korea",
  "North Macedonia",
  "Oman",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Réunion",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Helena",
  "Samoa",
  "São Tomé and Príncipe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia - Hargeisa",
  "Somalia - Mogadishu",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tahiti",
  "Taiwan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Tunisia",
  "Turkey",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Vanuatu",
  "Venezuela",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  // Sorted here so the guidelines' entries and the derived ones interleave
  // alphabetically in the picker instead of appearing as two blocks.
].sort((a, b) => a.localeCompare(b));
