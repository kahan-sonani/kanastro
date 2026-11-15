import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, LoaderCircle } from "lucide-react";
import type { Profile } from "../astro/types.ts";
import { validateProfile } from "../astro/birth.ts";
import { SelectControl } from "./SelectControl";
import { Modal } from "./Modal";
type City = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
  ascii: string;
};
let cityPromise: Promise<City[]> | undefined;
export function ProfileForm({
  profile,
  onSave,
  onClose,
}: {
  profile?: Profile;
  onSave: (p: Profile, old?: Profile) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    date: profile?.date ?? "",
    time: profile?.time ?? "",
    place: profile?.place ?? "",
    latitude: String(profile?.latitude ?? ""),
    longitude: String(profile?.longitude ?? ""),
    timeZone: profile?.timeZone ?? "Asia/Kolkata",
    certainty: profile?.certainty ?? "exact",
    disambiguation: profile?.disambiguation ?? "reject",
    notes: profile?.notes ?? "",
  });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [cities, setCities] = useState<City[]>([]),
    [suggestions, setSuggestions] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false),
    [cityError, setCityError] = useState(false);
  useEffect(() => {
    cityPromise ??= fetch("/cities.json").then((r) => {
      if (!r.ok) throw new Error("No city data");
      return r.json();
    });
    cityPromise.then(setCities).catch(() => {
      cityPromise = undefined;
      setCityError(true);
      setAdvanced(true);
    });
  }, []);
  const matches = useMemo(() => {
    const query = form.place.toLowerCase().trim();
    if (query.length < 2) return [];
    return cities
      .filter((c) =>
        `${c.name} ${c.ascii} ${c.country}`.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [cities, form.place]);
  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.latitude.trim() || !form.longitude.trim()) {
      setAdvanced(true);
      setError(
        "Choose a birthplace from the suggestions, or enter coordinates in Advanced details.",
      );
      return;
    }
    try {
      const now = new Date().toISOString();
      const p = validateProfile({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        id: profile?.id ?? crypto.randomUUID(),
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
      });
      setBusy(true);
      await onSave(p, profile);
      if (alive.current) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this profile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={profile ? "Edit profile" : "Create a birth profile"}
      onClose={onClose}
      busy={busy}
      wide
    >
      <form onSubmit={submit} className="profile-form">
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={120}
            placeholder="Enter a name"
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Date of birth
            <input
              required
              type="date"
              min="1800-01-01"
              max="2399-12-31"
              value={form.date}
              onInput={(e) => field("date", e.currentTarget.value)}
              onChange={(e) => field("date", e.target.value)}
            />
          </label>
          <label>
            Time of birth
            <input
              required
              type="time"
              step="1"
              value={form.time}
              onInput={(e) => field("time", e.currentTarget.value)}
              onChange={(e) => field("time", e.target.value)}
            />
          </label>
        </div>
        <div className="place-field">
          <label>
            Place of birth
            <div className="input-with-icon">
              <MapPin size={17} />
              <input
                required
                value={form.place}
                placeholder="Search a city, e.g. Jaipur"
                autoComplete="off"
                onFocus={() => setSuggestions(true)}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    place: e.target.value,
                    latitude: "",
                    longitude: "",
                  }));
                  setSuggestions(true);
                }}
                aria-expanded={suggestions && matches.length > 0}
                aria-controls="city-results"
              />
            </div>
          </label>
          {suggestions && matches.length > 0 && (
            <div
              className="city-results"
              id="city-results"
              aria-label="Birthplace suggestions"
            >
              {matches.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      place: `${c.name}, ${c.country}`,
                      latitude: String(c.lat),
                      longitude: String(c.lon),
                      timeZone: c.tz,
                    }));
                    setSuggestions(false);
                  }}
                >
                  <MapPin size={15} />
                  <span>
                    {c.name}
                    <small>
                      {c.country} · {c.tz}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="place-caption">
          {form.latitude && form.longitude
            ? `${form.latitude}°, ${form.longitude}° · ${form.timeZone}`
            : cityError
              ? "City search is unavailable. Enter coordinates below."
              : ""}
        </div>
        <label>
          Birth-time certainty
          <SelectControl
            label="Birth-time certainty"
            value={form.certainty}
            onChange={(v) => field("certainty", v)}
            options={[
              { value: "exact", label: "Known birth time" },
              { value: "approximate", label: "Approximate birth time" },
            ]}
          />
        </label>
        <button
          type="button"
          className="disclosure"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
        >
          Advanced details{" "}
          <ChevronDown size={16} className={advanced ? "rotated" : ""} />
        </button>
        {advanced && (
          <div className="advanced-fields">
            <div className="form-grid">
              <label>
                Latitude
                <input
                  required
                  type="number"
                  step="any"
                  min="-89.999999"
                  max="89.999999"
                  value={form.latitude}
                  onChange={(e) => field("latitude", e.target.value)}
                />
              </label>
              <label>
                Longitude
                <input
                  required
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={(e) => field("longitude", e.target.value)}
                />
              </label>
            </div>
            <label>
              IANA time zone
              <input
                required
                value={form.timeZone}
                placeholder="Asia/Kolkata"
                onChange={(e) => field("timeZone", e.target.value)}
              />
            </label>
            <label>
              Repeated daylight-saving time
              <SelectControl
                label="Repeated daylight-saving time"
                value={form.disambiguation}
                onChange={(v) => field("disambiguation", v)}
                options={[
                  { value: "reject", label: "Reject ambiguous times" },
                  { value: "earlier", label: "Earlier occurrence" },
                  { value: "later", label: "Later occurrence" },
                ]}
              />
            </label>
          </div>
        )}
        <label>
          <span className="field-label">Notes <span className="optional">Optional</span></span>
          <textarea
            rows={2}
            maxLength={20000}
            value={form.notes}
            placeholder=""
            onChange={(e) => field("notes", e.target.value)}
          />
        </label>
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <p className="attribution">
            <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> · CC BY 4.0
          </p>
          <button className="button primary" disabled={busy} type="submit">
            {busy && <LoaderCircle size={16} className="spin" />}
            {busy ? "Saving…" : profile ? "Save changes" : "Create profile"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
