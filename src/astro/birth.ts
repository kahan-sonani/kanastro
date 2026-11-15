import { Temporal } from "@js-temporal/polyfill";
import { AYANAMSAS } from "./types.ts";
import type { Profile, Settings } from "./types.ts";

export function birthInstant(profile: Profile) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(profile.date) ||
    !/^\d{2}:\d{2}(:\d{2})?$/.test(profile.time)
  )
    throw new Error("Enter a complete birth date and time.");
  const [hour, minute, second = 0] = profile.time.split(":").map(Number);
  if (hour > 23 || minute > 59 || second > 59)
    throw new Error(
      "Enter a valid clock time, with seconds between 00 and 59.",
    );
  const year = Number(profile.date.slice(0, 4));
  if (year < 1800 || year > 2399)
    throw new Error(
      "This version supports births from 1800 through 2399, matching the bundled ephemeris files.",
    );
  try {
    const local = Temporal.PlainDateTime.from(
      `${profile.date}T${profile.time}`,
      { overflow: "reject" },
    );
    const zoned = local.toZonedDateTime(profile.timeZone, {
      disambiguation: profile.disambiguation,
    });
    if (!zoned.toPlainDateTime().equals(local))
      throw new Error("Nonexistent local time");
    return {
      utc: zoned.toInstant().toString(),
      offset: zoned.offset,
      milliseconds: Number(zoned.epochMilliseconds),
    };
  } catch {
    throw new Error(
      "Check the birth date, time and IANA time zone. If daylight-saving time makes this time ambiguous, explicitly choose the earlier or later occurrence in Advanced details. Nonexistent local times must be corrected.",
    );
  }
}
export function validateProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") throw new Error("Invalid profile");
  const p = value as Profile;
  if (
    typeof p.id !== "string" ||
    !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(p.id)
  )
    throw new Error("Invalid profile ID");
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 120)
    throw new Error("Enter a name of up to 120 characters.");
  if (typeof p.place !== "string" || !p.place.trim() || p.place.length > 200)
    throw new Error("Enter a birthplace.");
  if (
    !Number.isFinite(p.latitude) ||
    Math.abs(p.latitude) >= 90 ||
    !Number.isFinite(p.longitude) ||
    Math.abs(p.longitude) > 180
  )
    throw new Error(
      "Latitude must be between −90 and 90 and longitude between −180 and 180.",
    );
  if (typeof p.timeZone !== "string" || p.timeZone.length > 100)
    throw new Error("Enter an IANA time zone.");
  if (
    !["exact", "approximate"].includes(p.certainty) ||
    !["reject", "earlier", "later"].includes(p.disambiguation)
  )
    throw new Error("Invalid birth-time options.");
  if (typeof p.notes !== "string" || p.notes.length > 20000)
    throw new Error("Notes may contain at most 20,000 characters.");
  if (
    typeof p.createdAt !== "string" ||
    typeof p.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(p.createdAt)) ||
    !Number.isFinite(Date.parse(p.updatedAt))
  )
    throw new Error("Invalid profile timestamps.");
  birthInstant(p);
  return {
    id: p.id.toLowerCase(),
    name: p.name.trim(),
    date: p.date,
    time: p.time,
    place: p.place.trim(),
    latitude: p.latitude,
    longitude: p.longitude,
    timeZone: p.timeZone,
    certainty: p.certainty,
    disambiguation: p.disambiguation,
    notes: p.notes,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
export function validateSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") throw new Error("Invalid settings");
  const s = value as Settings;
  if (
    !AYANAMSAS.some((a) => a.id === s.ayanamsa) ||
    !["mean", "true"].includes(s.nodes) ||
    ![7, 8].includes(s.karakas) ||
    ![365.25636, 365.2425, 360].includes(s.yearDays) ||
    !["from-sign", "from-aries"].includes(s.d60)
  )
    throw new Error("Unsupported calculation settings.");
  return {
    ayanamsa: s.ayanamsa,
    nodes: s.nodes,
    karakas: s.karakas,
    yearDays: s.yearDays,
    d60: s.d60,
  };
}
