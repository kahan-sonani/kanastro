import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateChart, createSwissEph } from "../src/astro/engine.ts";
import { birthInstant, validateProfile } from "../src/astro/birth.ts";
import {
  arudha,
  charaKarakas,
  grahaDrishti,
  mansion,
  mod,
  panchanga,
  rashiDrishti,
  subPeriods,
  vargaSign,
  VARGAS,
  vimshottari,
} from "../src/astro/rules.ts";
import { DEFAULT_SETTINGS } from "../src/astro/types.ts";
import type { Chart, Point, Profile } from "../src/astro/types.ts";

const profile: Profile = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Test profile",
  date: "1990-05-15",
  time: "14:30:00",
  place: "Jaipur",
  latitude: 26.91962,
  longitude: 75.78781,
  timeZone: "Asia/Kolkata",
  certainty: "exact",
  disambiguation: "reject",
  notes: "",
  createdAt: "2026-11-15T00:00:00Z",
  updatedAt: "2026-11-15T00:00:00Z",
};
let swe: Awaited<ReturnType<typeof createSwissEph>>;
before(async () => {
  const files = Object.fromEntries(
    await Promise.all(
      ["sepl_18.se1", "semo_18.se1"].map(async (n) => [
        n,
        new Uint8Array(
          await readFile(
            new URL(
              `../node_modules/@kuntay/swisseph-data/ephe/${n}`,
              import.meta.url,
            ),
          ),
        ),
      ]),
    ),
  );
  swe = await createSwissEph({ files });
});
after(() => swe?.dispose());

test("WASM results match 96 independently generated native reference charts", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/native-swiss.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(fixtures.cases.length, 96);
  const close = (a: number, b: number, tolerance: number, label: string) =>
    assert.ok(Math.abs(a - b) < tolerance, `${label}: ${a} vs ${b}`);
  for (const f of fixtures.cases) {
    const chart = calculateChart(
      swe,
      { ...profile, ...f },
      { ...DEFAULT_SETTINGS, ayanamsa: f.ayanamsa, nodes: f.nodes },
    );
    const label = `${f.date}/${f.ayanamsa}/${f.nodes}`;
    assert.equal(chart.utc, f.utc, label);
    close(chart.julianDay, f.jd, 1e-9, `${label}/JD`);
    close(chart.ascendant.longitude, f.ascendant, 1e-7, `${label}/Lagna`);
    close(chart.ayanamsa, f.ayanamsaValue, 1e-7, `${label}/ayanamsa`);
    for (let i = 0; i < 8; i++) {
      close(
        chart.planets[i].longitude,
        f.planets[i].longitude,
        1e-7,
        `${label}/${i}/longitude`,
      );
      close(
        chart.planets[i].latitude,
        f.planets[i].latitude,
        1e-7,
        `${label}/${i}/latitude`,
      );
      close(
        chart.planets[i].speed,
        f.planets[i].speed,
        1e-6,
        `${label}/${i}/speed`,
      );
    }
    close(
      mod(chart.planets[8].longitude - chart.planets[7].longitude),
      180,
      1e-10,
      "Nodes are opposite",
    );
  }
});

test("missing ephemeris files cannot silently return a precise chart", async () => {
  const empty = await createSwissEph();
  try {
    assert.throws(
      () => calculateChart(empty, profile, DEFAULT_SETTINGS),
      /precise ephemeris/,
    );
  } finally {
    empty.dispose();
  }
});
test("DST fold requires an explicit choice; nonexistent times are always rejected", () => {
  const p = {
    ...profile,
    date: "2024-11-03",
    time: "01:30:00",
    timeZone: "America/New_York",
  };
  assert.throws(() => birthInstant(p), /ambiguous/);
  const earlier = birthInstant({ ...p, disambiguation: "earlier" }),
    later = birthInstant({ ...p, disambiguation: "later" });
  assert.equal(later.milliseconds - earlier.milliseconds, 3600000);
  for (const disambiguation of ["reject", "earlier", "later"] as const)
    assert.throws(
      () =>
        birthInstant({
          ...p,
          date: "2024-03-10",
          time: "02:30:00",
          disambiguation,
        }),
      /Nonexistent local times/,
    );
});
test("invalid dates, coordinates, and import records are rejected", () => {
  assert.throws(() => validateProfile({ ...profile, date: "2023-02-29" }));
  assert.throws(() => validateProfile({ ...profile, date: "1799-12-31" }));
  assert.throws(() => validateProfile({ ...profile, latitude: 90 }));
  assert.throws(() => validateProfile({ ...profile, longitude: NaN }));
  assert.throws(() => validateProfile({ ...profile, name: "   " }));
  assert.throws(() => validateProfile({ ...profile, id: "bad-id" }));
  assert.throws(() => validateProfile({ ...profile, id: "-".repeat(36) }));
  assert.throws(() => validateProfile({ ...profile, createdAt: 1 }));
  assert.throws(() => validateProfile({ ...profile, time: "23:59:60" }));
});
test("historical sub-minute time-zone offsets are preserved", () => {
  assert.equal(
    birthInstant({
      ...profile,
      date: "1850-06-12",
      time: "04:23:01",
      timeZone: "Asia/Kolkata",
    }).utc,
    "1850-06-11T22:29:33Z",
  );
});
test("nakshatra and pada boundaries use the unrounded longitude", () => {
  assert.deepEqual([mansion(0).name, mansion(0).pada], ["Ashwini", 1]);
  assert.equal(mansion(10).pada, 4);
  assert.equal(mansion(40 / 3).name, "Bharani");
  assert.equal(mansion(40 / 3 - 1e-7).name, "Ashwini");
  assert.equal(mansion(360).name, "Ashwini");
  assert.equal(mansion(359.99999).pada, 4);
});
test("traditional Hora, Navamsha, Dashamsha and unequal Trimshamsha boundaries", () => {
  assert.equal(vargaSign(14.99999, 2), 4);
  assert.equal(vargaSign(15, 2), 3);
  assert.equal(vargaSign(30, 2), 3);
  assert.equal(vargaSign(45, 2), 4);
  assert.equal(vargaSign(30, 9), 9);
  assert.equal(vargaSign(60, 9), 6);
  assert.equal(vargaSign(90, 9), 3);
  assert.equal(vargaSign(30, 10), 9);
  assert.equal(vargaSign(33, 10), 10);
  for (const [lon, sign] of [
    [0, 0],
    [5, 10],
    [10, 8],
    [18, 2],
    [25, 6],
    [30, 1],
    [35, 5],
    [42, 11],
    [50, 9],
    [55, 7],
  ])
    assert.equal(vargaSign(lon, 30), sign);
  assert.equal(vargaSign(31, 60, "from-sign"), 3);
  assert.equal(vargaSign(31, 60, "from-aries"), 2);
});
test("all supported divisional mappings stay in range across all signs and divisions", () => {
  for (const { n } of VARGAS)
    for (let s = 0; s < 12; s++)
      for (let p = 0; p < n; p++) {
        const result = vargaSign(s * 30 + ((p + 0.5) * 30) / n, n);
        assert.ok(Number.isInteger(result) && result >= 0 && result < 12);
      }
  assert.throws(() => vargaSign(10, 11));
});
function point(name: Point["name"], longitude: number): Point {
  return { name, longitude, latitude: 0, speed: 1, retrograde: false };
}
test("Jaimini rank reverses Rahu and excludes Ketu; exact ties are disclosed", () => {
  const planets = [
    point("Sun", 25),
    point("Moon", 22),
    point("Mars", 19),
    point("Mercury", 16),
    point("Jupiter", 13),
    point("Venus", 10),
    point("Saturn", 7),
    point("Rahu", 1),
    point("Ketu", 181),
  ];
  assert.equal(charaKarakas(planets, 7)[0].point.name, "Sun");
  assert.equal(charaKarakas(planets, 8)[0].point.name, "Rahu");
  assert.equal(charaKarakas(planets, 8)[0].rank, 29);
  assert.ok(charaKarakas([...planets.slice(1), point("Sun", 22)], 7)[0].tied);
});
test("arudha exceptions and Jaimini sign aspects are deterministic", () => {
  assert.equal(arudha(0, [point("Mars", 0)]), 9);
  assert.equal(arudha(0, [point("Mars", 90)]), 3);
  assert.equal(arudha(0, [point("Mars", 30)]), 2);
  assert.deepEqual(rashiDrishti(0), [4, 7, 10]);
  assert.deepEqual(rashiDrishti(1), [3, 6, 9]);
  assert.deepEqual(rashiDrishti(2), [5, 8, 11]);
  assert.deepEqual(grahaDrishti(point("Saturn", 0)), [2, 6, 9]);
});
test("panchanga discontinuities classify new/full Moon and fixed karanas", () => {
  const p = (lon: number) => panchanga([point("Sun", 0), point("Moon", lon)]);
  assert.equal(p(0).karana, "Kimstughna");
  assert.equal(p(6).karana, "Bava");
  assert.equal(p(168).tithi, "Purnima");
  assert.equal(p(180).paksha, "Krishna");
  assert.equal(p(342).karana, "Shakuni");
  assert.equal(p(348).karana, "Chatushpada");
  assert.equal(p(354).karana, "Naga");
});
test("dasha children cover their parent without gaps and retain the full birth-period origin", () => {
  const chart = calculateChart(swe, profile, DEFAULT_SETTINGS),
    periods = vimshottari(chart),
    birth = Date.parse(chart.utc);
  assert.ok(periods[0].start < birth && birth < periods[0].end);
  for (const period of periods) {
    const children = subPeriods(period);
    assert.equal(children[0].start, period.start);
    assert.equal(children.at(-1)!.end, period.end);
    assert.equal(children[0].lord, period.lord);
    children.slice(1).forEach((c, i) => assert.equal(c.start, children[i].end));
  }
  const cycleDays = (periods[8].end - periods[0].start) / 86400000;
  assert.ok(Math.abs(cycleDays - 120 * DEFAULT_SETTINGS.yearDays) < 1e-6);
});
