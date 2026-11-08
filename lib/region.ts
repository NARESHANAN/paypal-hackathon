export const COUNTRY_OPTIONS = [
  { code: "IN", name: "India", locale: "en-IN", currency: "INR" },
  { code: "US", name: "United States", locale: "en-US", currency: "USD" },
  { code: "GB", name: "United Kingdom", locale: "en-GB", currency: "GBP" },
  { code: "DE", name: "Germany", locale: "de-DE", currency: "EUR" },
  { code: "FR", name: "France", locale: "fr-FR", currency: "EUR" },
  { code: "IT", name: "Italy", locale: "it-IT", currency: "EUR" },
  { code: "ES", name: "Spain", locale: "es-ES", currency: "EUR" },
  { code: "IE", name: "Ireland", locale: "en-IE", currency: "EUR" },
  { code: "NL", name: "Netherlands", locale: "nl-NL", currency: "EUR" },
  { code: "CA", name: "Canada", locale: "en-CA", currency: "CAD" },
  { code: "AU", name: "Australia", locale: "en-AU", currency: "AUD" },
  { code: "NZ", name: "New Zealand", locale: "en-NZ", currency: "NZD" },
  { code: "SG", name: "Singapore", locale: "en-SG", currency: "SGD" },
  { code: "AE", name: "United Arab Emirates", locale: "en-AE", currency: "AED" },
  { code: "JP", name: "Japan", locale: "ja-JP", currency: "JPY" },
  { code: "CH", name: "Switzerland", locale: "de-CH", currency: "CHF" },
  { code: "BR", name: "Brazil", locale: "pt-BR", currency: "BRL" },
  { code: "MX", name: "Mexico", locale: "es-MX", currency: "MXN" },
  { code: "ZA", name: "South Africa", locale: "en-ZA", currency: "ZAR" },
] as const;

export const CURRENCY_OPTIONS = [
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["INR", "Indian Rupee"],
  ["GBP", "British Pound"],
  ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"],
  ["NZD", "New Zealand Dollar"],
  ["SGD", "Singapore Dollar"],
  ["AED", "UAE Dirham"],
  ["JPY", "Japanese Yen"],
  ["CHF", "Swiss Franc"],
  ["BRL", "Brazilian Real"],
  ["MXN", "Mexican Peso"],
  ["ZAR", "South African Rand"],
] as const;

export const DEFAULT_CURRENCY = "USD";

export const REGION_DEMO_GROUPS: Record<
  (typeof COUNTRY_OPTIONS)[number]["code"],
  { names: [string, string, string]; cab: string; dinner: string; snacks: string }
> = {
  IN: { names: ["Raju", "Priya", "Dev"], cab: "cab", dinner: "dinner", snacks: "snacks" },
  US: { names: ["Alex", "Jordan", "Taylor"], cab: "rideshare", dinner: "dinner", snacks: "snacks" },
  GB: { names: ["Oliver", "Amelia", "Charlie"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  DE: { names: ["Lukas", "Mia", "Felix"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  FR: { names: ["Hugo", "Emma", "Louis"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  IT: { names: ["Marco", "Giulia", "Luca"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  ES: { names: ["Alejandro", "Lucia", "Pablo"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  IE: { names: ["Conor", "Aoife", "Jack"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  NL: { names: ["Daan", "Emma", "Sem"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  CA: { names: ["Liam", "Olivia", "Noah"], cab: "rideshare", dinner: "dinner", snacks: "snacks" },
  AU: { names: ["Jack", "Charlotte", "Oliver"], cab: "rideshare", dinner: "dinner", snacks: "snacks" },
  NZ: { names: ["Lachlan", "Isla", "Aria"], cab: "rideshare", dinner: "dinner", snacks: "snacks" },
  SG: { names: ["Wei Ming", "Aisha", "Raj"], cab: "ride", dinner: "dinner", snacks: "snacks" },
  AE: { names: ["Omar", "Mariam", "Zayed"], cab: "ride", dinner: "dinner", snacks: "snacks" },
  JP: { names: ["Haruto", "Yui", "Ren"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  CH: { names: ["Luca", "Mia", "Noah"], cab: "taxi", dinner: "dinner", snacks: "snacks" },
  BR: { names: ["Lucas", "Julia", "Gabriel"], cab: "ride", dinner: "jantar", snacks: "lanches" },
  MX: { names: ["Santiago", "Valentina", "Mateo"], cab: "taxi", dinner: "cena", snacks: "botanas" },
  ZA: { names: ["Lethabo", "Amara", "Liam"], cab: "ride", dinner: "dinner", snacks: "snacks" },
};

export function getRegionSample(countryCode: string) {
  const group =
    REGION_DEMO_GROUPS[countryCode as keyof typeof REGION_DEMO_GROUPS] ??
    REGION_DEMO_GROUPS.IN;
  const [payerOne, payerTwo, excluded] = group.names;
  const chat = `${payerOne} paid 2400 for the ${group.cab}. Everyone was in.\n${payerTwo} covered ${group.dinner} for 3200, but ${excluded} didn't eat.\nI paid 800 for ${group.snacks}.`;

  return {
    names: group.names,
    participants: `You, ${group.names.join(", ")}`,
    chat,
  };
}

export function currencyFractionDigits(currency: string, locale = "en") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits ?? 2;
}
