import { useState } from "react";
import { Settings2, Check } from "lucide-react";
import { AYANAMSAS } from "../astro/types.ts";
import type { Settings } from "../astro/types.ts";
import { SelectControl } from "./SelectControl";

export function SettingsForm({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (s: Settings) => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <div className="settings-layout">
      <section className="panel settings-panel">
        <div className="section-heading">
          <h2>Chart conventions</h2>
          <Settings2 size={23} />
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            setError("");
            try {
              await onSave(draft);
              setMessage("Settings saved");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Ayanamsa
            <SelectControl
              label="Ayanamsa"
              value={String(draft.ayanamsa)}
              onChange={(v) => setDraft({ ...draft, ayanamsa: Number(v) })}
              options={AYANAMSAS.map((a) => ({
                value: String(a.id),
                label: a.name,
              }))}
            />
          </label>
          <div className="form-grid">
            <label>
              Lunar nodes
              <SelectControl
                label="Lunar nodes"
                value={draft.nodes}
                onChange={(v) =>
                  setDraft({ ...draft, nodes: v as Settings["nodes"] })
                }
                options={[
                  { value: "mean", label: "Mean Rahu / Ketu" },
                  { value: "true", label: "True Rahu / Ketu" },
                ]}
              />
            </label>
            <label>
              Chara karakas
              <SelectControl
                label="Chara karakas"
                value={String(draft.karakas)}
                onChange={(v) =>
                  setDraft({ ...draft, karakas: Number(v) as 7 | 8 })
                }
                options={[
                  { value: "7", label: "7 karakas · excludes Rahu" },
                  { value: "8", label: "8 karakas · includes Rahu" },
                ]}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Dasha year length
              <SelectControl
                label="Dasha year length"
                value={String(draft.yearDays)}
                onChange={(v) => setDraft({ ...draft, yearDays: Number(v) })}
                options={[
                  { value: "365.25636", label: "Sidereal · 365.25636 days" },
                  { value: "365.2425", label: "365.2425 days" },
                  { value: "360", label: "Savana · 360 days" },
                ]}
              />
            </label>
            <label>
              D60 counting begins
              <SelectControl
                label="D60 counting begins"
                value={draft.d60}
                onChange={(v) =>
                  setDraft({ ...draft, d60: v as Settings["d60"] })
                }
                options={[
                  { value: "from-sign", label: "From the natal sign" },
                  { value: "from-aries", label: "From Aries" },
                ]}
              />
            </label>
          </div>
          {message && (
            <div className="success-box" role="status">
              <Check size={16} />
              {message}
            </div>
          )}
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </section>
      <aside className="panel method-card">
        <h3>Defaults</h3>
        <dl>
          <dt>Rashi houses</dt>
          <dd>Whole sign</dd>
          <dt>Birth dates</dt>
          <dd>1800–2399</dd>
          <dt>Hora / D2</dt>
          <dd>Cancer–Leo</dd>
          <dt>Trimshamsha / D30</dt>
          <dd>Unequal segments</dd>
          <dt>7-karaka convention</dt>
          <dd>Excludes Pitri karaka</dd>
        </dl>
        <a className="text-link" href="/source/kanastro-source.tar.gz" download>
          Method documentation ↗
        </a>
      </aside>
    </div>
  );
}
