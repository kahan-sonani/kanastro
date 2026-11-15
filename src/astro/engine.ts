import { Body, Flag, createSwissEph } from "@kuntay/swisseph";
import type { SwissEph } from "@kuntay/swisseph";
import { birthInstant, validateProfile, validateSettings } from "./birth.ts";
import { mod } from "./rules.ts";
import type { Chart, PlanetName, Point, Profile, Settings } from "./types.ts";

export { createSwissEph };
export function calculateChart(
  swe: SwissEph,
  input: Profile,
  options: Settings,
): Chart {
  const profile = validateProfile(input),
    settings = validateSettings(options),
    instant = birthInstant(profile);
  const jd = instant.milliseconds / 86400000 + 2440587.5;
  swe.setSiderealMode(settings.ayanamsa);
  const bodies: [PlanetName, number][] = [
    ["Sun", Body.Sun],
    ["Moon", Body.Moon],
    ["Mars", Body.Mars],
    ["Mercury", Body.Mercury],
    ["Jupiter", Body.Jupiter],
    ["Venus", Body.Venus],
    ["Saturn", Body.Saturn],
    [
      "Rahu",
      settings.nodes === "mean" ? Body.NorthNodeMean : Body.NorthNodeTrue,
    ],
  ];
  const planets: Point[] = bodies.map(([name, body]) => {
    const p = swe.calc(jd, body, { flags: Flag.Sidereal, ephemeris: "swiss" });
    // The mean node is an analytical element even with Swiss files; verify all physical bodies and true node.
    if (
      p.ephemeris !== "swiss" &&
      !(name === "Rahu" && settings.nodes === "mean")
    )
      throw new Error(
        `The precise ephemeris for ${name} is unavailable. Reload the calculation files and try again.`,
      );
    if (![p.longitude, p.latitude, p.longitudeSpeed].every(Number.isFinite))
      throw new Error(`Invalid ${name} position`);
    return {
      name,
      longitude: mod(p.longitude),
      latitude: p.latitude,
      speed: p.longitudeSpeed,
      retrograde: p.longitudeSpeed < 0,
    };
  });
  const rahu = planets[7];
  planets.push({
    ...rahu,
    name: "Ketu",
    longitude: mod(rahu.longitude + 180),
    latitude: -rahu.latitude,
  });
  const houses = swe.houses(jd, profile.latitude, profile.longitude, "W", {
    flags: Flag.Sidereal,
  });
  if (houses.substituted || !Number.isFinite(houses.ascendant))
    throw new Error(
      "The requested ascendant could not be calculated for this location.",
    );
  return {
    profileId: profile.id,
    julianDay: jd,
    utc: instant.utc,
    utcOffset: instant.offset,
    ayanamsa: swe.ayanamsa(jd),
    ascendant: {
      name: "Lagna",
      longitude: houses.ascendant,
      latitude: 0,
      speed: 0,
      retrograde: false,
    },
    planets,
    settings,
    engine: `Swiss Ephemeris ${swe.version} · rules 0.1.0 · data 0.2.2`,
  };
}
