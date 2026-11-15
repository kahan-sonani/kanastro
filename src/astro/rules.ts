import { DASHA_LORDS, DASHA_YEARS, NAKSHATRAS, SIGN_LORDS } from "./types.ts";
import type { Chart, Point, Settings } from "./types.ts";

export function mod(n: number, d = 360): number {
  // Avoid adding a full circle to positive values: that loses precision at varga/nakshatra boundaries.
  const remainder = n % d;
  return remainder < 0 ? remainder + d : remainder === 0 ? 0 : remainder;
}
export function signOf(longitude: number): number {
  return Math.floor(mod(longitude) / 30);
}
export function degree(longitude: number): number {
  return mod(longitude, 30);
}
export function dms(longitude: number): string {
  const seconds = Math.floor(mod(longitude, 30) * 3600 + 1e-8);
  return `${Math.floor(seconds / 3600)}° ${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}′ ${String(seconds % 60).padStart(2, "0")}″`;
}
export function angleDms(value: number): string {
  const seconds = Math.floor(Math.abs(value) * 3600);
  return `${Math.floor(seconds / 3600)}° ${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}′ ${String(seconds % 60).padStart(2, "0")}″`;
}
export function mansion(longitude: number) {
  const units = (mod(longitude) * 3) / 40;
  const index = Math.floor(units);
  const pada = Math.min(4, Math.floor((units - index) * 4) + 1);
  return {
    index,
    name: NAKSHATRAS[index],
    pada,
    lord: DASHA_LORDS[index % 9],
    fraction: units - index,
  };
}
export const VARGAS = [
  { n: 1, name: "Rashi", focus: "Birth chart" },
  { n: 2, name: "Hora", focus: "Resources" },
  { n: 3, name: "Drekkana", focus: "Siblings & initiative" },
  { n: 4, name: "Chaturthamsha", focus: "Home & foundations" },
  { n: 7, name: "Saptamsha", focus: "Children & creativity" },
  { n: 9, name: "Navamsha", focus: "Dharma & partnership" },
  { n: 10, name: "Dashamsha", focus: "Work & vocation" },
  { n: 12, name: "Dwadashamsha", focus: "Parents & ancestry" },
  { n: 16, name: "Shodashamsha", focus: "Comforts" },
  { n: 20, name: "Vimshamsha", focus: "Spiritual practice" },
  { n: 24, name: "Chaturvimshamsha", focus: "Learning" },
  { n: 27, name: "Saptavimshamsha", focus: "Strengths" },
  { n: 30, name: "Trimshamsha", focus: "Challenges" },
  { n: 40, name: "Khavedamsha", focus: "Maternal inheritance" },
  { n: 45, name: "Akshavedamsha", focus: "Paternal inheritance" },
  { n: 60, name: "Shashtiamsha", focus: "Subtle influences" },
];

/** Named traditional Parashari mappings. Sign intervals are half-open; no rounding before classification.
 * D2 uses Cancer/Leo Hora; D30 uses unequal segments. D60 seed is an explicit setting.
 * See METHODS.md for definitions, references, and remaining validation limits.
 */
export function vargaSign(
  longitude: number,
  n: number,
  d60: Settings["d60"] = "from-sign",
): number {
  const s = signOf(longitude),
    d = degree(longitude),
    part = Math.min(n - 1, Math.floor((d * n) / 30));
  const odd = s % 2 === 0;
  switch (n) {
    case 1:
      return s;
    case 2:
      return (odd ? part === 0 : part === 1) ? 4 : 3;
    case 3:
      return mod(s + 4 * part, 12);
    case 4:
      return mod(s + 3 * part, 12);
    case 7:
      return mod(s + (odd ? 0 : 6) + part, 12);
    case 9:
      return mod(s * 9 + part, 12);
    case 10:
      return mod(s + (odd ? 0 : 8) + part, 12);
    case 12:
      return mod(s + part, 12);
    case 16:
    case 45:
      return mod((s % 3) * 4 + part, 12);
    case 20:
      return mod([0, 8, 4][s % 3] + part, 12);
    case 24:
      return mod((odd ? 4 : 3) + part, 12);
    case 27:
      return mod((s % 4) * 3 + part, 12);
    case 30: {
      const segments = odd
        ? [
            [5, 0],
            [10, 10],
            [18, 8],
            [25, 2],
            [30, 6],
          ]
        : [
            [5, 1],
            [12, 5],
            [20, 11],
            [25, 9],
            [30, 7],
          ];
      return segments.find(([end]) => d < end)![1];
    }
    case 40:
      return mod((odd ? 0 : 6) + part, 12);
    case 60:
      return mod((d60 === "from-sign" ? s : 0) + part, 12);
    default:
      throw new Error(`D${n} has no validated mapping in this version.`);
  }
}

export function houseOf(longitude: number, ascendant: number): number {
  return mod(signOf(longitude) - signOf(ascendant), 12) + 1;
}
export function angularDistance(a: number, b: number) {
  return Math.min(mod(a - b), mod(b - a));
}

export function dignity(point: Point): string {
  const s = signOf(point.longitude);
  const exalted: Record<string, number> = {
    Sun: 0,
    Moon: 1,
    Mars: 9,
    Mercury: 5,
    Jupiter: 3,
    Venus: 11,
    Saturn: 6,
  };
  if (point.name in exalted) {
    if (s === exalted[point.name]) return "Exalted";
    if (s === mod(exalted[point.name] + 6, 12)) return "Debilitated";
    if (SIGN_LORDS[s] === point.name) return "Own sign";
  }
  return "—";
}
export function combust(point: Point, sun: Point): boolean {
  const orbs: Record<string, number> = {
    Moon: 12,
    Mars: 17,
    Mercury: point.retrograde ? 12 : 14,
    Jupiter: 11,
    Venus: point.retrograde ? 8 : 10,
    Saturn: 15,
  };
  return (
    point.name in orbs &&
    angularDistance(point.longitude, sun.longitude) < orbs[point.name]
  );
}
export function grahaDrishti(point: Point): number[] {
  const offsets =
    point.name === "Mars"
      ? [3, 6, 7]
      : point.name === "Jupiter"
        ? [4, 6, 8]
        : point.name === "Saturn"
          ? [2, 6, 9]
          : ["Sun", "Moon", "Mercury", "Venus"].includes(point.name)
            ? [6]
            : [];
  return offsets.map((d) => mod(signOf(point.longitude) + d, 12));
}
export function rashiDrishti(sign: number): number[] {
  return Array.from({ length: 12 }, (_, i) => i).filter((target) => {
    if (sign % 3 === 0) return target % 3 === 1 && target !== mod(sign + 1, 12);
    if (sign % 3 === 1) return target % 3 === 0 && target !== mod(sign - 1, 12);
    return target % 3 === 2 && target !== sign;
  });
}
export function charaKarakas(planets: Point[], count: 7 | 8) {
  const labels =
    count === 8
      ? [
          "Atma",
          "Amatya",
          "Bhratri",
          "Matri",
          "Pitri",
          "Putra",
          "Gnati",
          "Dara",
        ]
      : ["Atma", "Amatya", "Bhratri", "Matri", "Putra", "Gnati", "Dara"];
  const sorted = planets
    .filter((p) => p.name !== "Ketu" && (count === 8 || p.name !== "Rahu"))
    .map((p) => ({
      point: p,
      rank: p.name === "Rahu" ? 30 - degree(p.longitude) : degree(p.longitude),
    }))
    .sort((a, b) => b.rank - a.rank);
  return sorted.map((v, i) => ({
    ...v,
    karaka: labels[i],
    tied: sorted.some((q, j) => j !== i && Math.abs(q.rank - v.rank) < 1e-10),
  }));
}
/** Classical seven sign-lord scheme; if the projected pada is in the source or seventh, move it to its tenth. */
export function arudha(sourceSign: number, planets: Point[]): number {
  const lord = planets.find((p) => p.name === SIGN_LORDS[sourceSign]);
  if (!lord) throw new Error("Missing sign lord");
  const distance = mod(signOf(lord.longitude) - sourceSign, 12);
  let projected = mod(sourceSign + 2 * distance, 12);
  if (projected === sourceSign || projected === mod(sourceSign + 6, 12))
    projected = mod(projected + 9, 12);
  return projected;
}

const TITHIS = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
];
const YOGAS = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];
export function panchanga(planets: Point[]) {
  const sun = planets.find((p) => p.name === "Sun")!,
    moon = planets.find((p) => p.name === "Moon")!;
  const elongation = mod(moon.longitude - sun.longitude),
    t = Math.floor(elongation / 12),
    k = Math.floor(elongation / 6);
  const karana =
    k === 0
      ? "Kimstughna"
      : k === 57
        ? "Shakuni"
        : k === 58
          ? "Chatushpada"
          : k === 59
            ? "Naga"
            : [
                "Bava",
                "Balava",
                "Kaulava",
                "Taitila",
                "Garaja",
                "Vanija",
                "Vishti",
              ][(k - 1) % 7];
  return {
    tithi: t === 14 ? "Purnima" : t === 29 ? "Amavasya" : TITHIS[t % 15],
    paksha: t < 15 ? "Shukla" : "Krishna",
    nakshatra: mansion(moon.longitude),
    yoga: YOGAS[Math.floor((mod(sun.longitude + moon.longitude) * 3) / 40)],
    karana,
    illumination: (1 - Math.cos((elongation * Math.PI) / 180)) / 2,
  };
}

export interface DashaPeriod {
  lord: string;
  start: number;
  end: number;
}
export function vimshottari(chart: Chart): DashaPeriod[] {
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const star = mansion(moon.longitude),
    index = star.index % 9;
  let cursor =
    Date.parse(chart.utc) -
    star.fraction * DASHA_YEARS[index] * chart.settings.yearDays * 86400000;
  return Array.from({ length: 18 }, (_, i) => {
    const j = (index + i) % 9,
      start = cursor;
    cursor += DASHA_YEARS[j] * chart.settings.yearDays * 86400000;
    return { lord: DASHA_LORDS[j], start, end: cursor };
  });
}
export function subPeriods(parent: DashaPeriod): DashaPeriod[] {
  const index = DASHA_LORDS.indexOf(
    parent.lord as (typeof DASHA_LORDS)[number],
  );
  if (index < 0) throw new Error("Unknown dasha lord");
  let cursor = parent.start;
  return Array.from({ length: 9 }, (_, i) => {
    const j = (index + i) % 9,
      start = cursor;
    cursor += ((parent.end - parent.start) * DASHA_YEARS[j]) / 120;
    return { lord: DASHA_LORDS[j], start, end: i === 8 ? parent.end : cursor };
  });
}
