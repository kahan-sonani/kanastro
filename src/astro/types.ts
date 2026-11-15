export type PlanetName =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu";
export interface Settings {
  ayanamsa: number;
  nodes: "mean" | "true";
  karakas: 7 | 8;
  yearDays: number;
  d60: "from-sign" | "from-aries";
}
export interface Profile {
  id: string;
  name: string;
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  certainty: "exact" | "approximate";
  disambiguation: "reject" | "earlier" | "later";
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface Point {
  name: PlanetName | "Lagna";
  longitude: number;
  latitude: number;
  speed: number;
  retrograde: boolean;
}
export interface Chart {
  profileId: string;
  julianDay: number;
  utc: string;
  utcOffset: string;
  ayanamsa: number;
  ascendant: Point;
  planets: Point[];
  settings: Settings;
  engine: string;
}
export const DEFAULT_SETTINGS: Settings = {
  ayanamsa: 1,
  nodes: "mean",
  karakas: 7,
  yearDays: 365.25636,
  d60: "from-sign",
};
export const AYANAMSAS = [
  { id: 1, name: "Lahiri", description: "Standard Swiss Ephemeris Lahiri" },
  { id: 3, name: "Raman", description: "B. V. Raman" },
  { id: 5, name: "Krishnamurti", description: "Swiss Ephemeris Krishnamurti" },
  { id: 27, name: "True Chitra", description: "Spica fixed at 180°" },
  { id: 7, name: "Yukteshwar", description: "Sri Yukteshwar" },
  {
    id: 0,
    name: "Fagan–Bradley",
    description: "Fagan–Bradley sidereal zodiac",
  },
];
export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
export const SANSKRIT_SIGNS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrishchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];
export const SIGN_LORDS: PlanetName[] = [
  "Mars",
  "Venus",
  "Mercury",
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Saturn",
  "Jupiter",
];
export const SHORT: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Lagna: "Asc",
};
export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];
export const DASHA_LORDS: PlanetName[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
export const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
