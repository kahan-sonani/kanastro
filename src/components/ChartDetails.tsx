import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  Orbit,
  Sparkles,
} from "lucide-react";
import type { Chart, Point, Profile } from "../astro/types.ts";
import { AYANAMSAS, SIGNS, SIGN_LORDS, SHORT } from "../astro/types.ts";
import {
  angularDistance,
  angleDms,
  arudha,
  charaKarakas,
  combust,
  degree,
  dignity,
  dms,
  grahaDrishti,
  houseOf,
  mansion,
  mod,
  panchanga,
  rashiDrishti,
  signOf,
  subPeriods,
  vargaSign,
  VARGAS,
  vimshottari,
} from "../astro/rules.ts";
import type { DashaPeriod } from "../astro/rules.ts";
import { NorthChart } from "./NorthChart";
import { SelectControl } from "./SelectControl";

export function dateLabel(date: string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      typeof date === "string" && date.length === 10
        ? `${date}T12:00:00Z`
        : date,
    ),
  );
}
export function DivisionSelect({
  value,
  onChange,
  label = "Divisional chart",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <SelectControl
      className="division-select"
      label={label}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={VARGAS.map((v) => ({
        value: String(v.n),
        label: `D${v.n} · ${v.name}`,
      }))}
    />
  );
}
export function PlanetTable({
  chart,
  compact = false,
}: {
  chart: Chart;
  compact?: boolean;
}) {
  const sun = chart.planets.find((p) => p.name === "Sun")!;
  return (
    <div className="table-scroll">
      <table className={`planet-table ${compact ? "compact-table" : ""}`}>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Sign & degree</th>
            <th>Nakshatra</th>
            <th>Pada</th>
            {!compact && (
              <>
                <th>House</th>
                <th>Sign lord</th>
                <th>State</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {[chart.ascendant, ...chart.planets].map((p) => {
            const star = mansion(p.longitude);
            return (
              <tr key={p.name}>
                <td>
                  <span className={`planet-dot planet-${p.name.toLowerCase()}`}>
                    {SHORT[p.name]}
                  </span>
                  <strong>{p.name}</strong>
                  {p.retrograde && (
                    <span className="retro-badge" title="Retrograde">
                      R
                    </span>
                  )}
                </td>
                <td>
                  <span>{SIGNS[signOf(p.longitude)]}</span>
                  <small className="tabular">{dms(p.longitude)}</small>
                </td>
                <td>
                  {star.name}
                  <small>{star.lord}</small>
                </td>
                <td>{star.pada}</td>
                {!compact && (
                  <>
                    <td>{houseOf(p.longitude, chart.ascendant.longitude)}</td>
                    <td>{SIGN_LORDS[signOf(p.longitude)]}</td>
                    <td>
                      <span
                        className={`dignity ${dignity(p) === "Exalted" ? "positive" : ""}`}
                      >
                        {dignity(p)}
                      </span>
                      {combust(p, sun) && (
                        <small className="amber-text">Combust</small>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Panchanga({ chart }: { chart: Chart }) {
  const p = panchanga(chart.planets);
  return (
    <section className="panel panchanga-panel">
      <div className="panel-title">
        <h3>Birth panchanga</h3>
      </div>
      <div className="panchanga-grid">
        {[
          ["Tithi", `${p.paksha} ${p.tithi}`],
          ["Nakshatra", p.nakshatra.name],
          ["Yoga", p.yoga],
          ["Karana", p.karana],
        ].map(([name, value]) => (
          <div key={name}>
            <span className="eyebrow">{name}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function PeriodRow({
  period,
  depth = 0,
  now,
}: {
  period: DashaPeriod;
  depth?: number;
  now: number;
}) {
  const current = period.start <= now && now < period.end;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`period-row depth-${depth} ${current ? "current-period" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        disabled={depth >= 2}
      >
        <span>
          {depth < 2 &&
            (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
          <span className={`planet-dot planet-${period.lord.toLowerCase()}`}>
            {SHORT[period.lord]}
          </span>
          <strong>{period.lord}</strong>
          {current && <span className="pill active-pill">Current</span>}
        </span>
        <span>{dateLabel(period.start)}</span>
        <span>{dateLabel(period.end)}</span>
      </button>
      {open &&
        depth < 2 &&
        subPeriods(period).map((p) => (
          <PeriodRow key={p.start} period={p} depth={depth + 1} now={now} />
        ))}
    </>
  );
}
function Dashas({ chart }: { chart: Chart }) {
  const periods = vimshottari(chart),
    now = Date.now(),
    current = periods.find((p) => p.start <= now && now < p.end),
    birth = Date.parse(chart.utc);
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Vimshottari dasha</h2>
        </div>
        <Clock3 size={24} />
      </div>
      <div className="dasha-summary">
        <div>
          <span className="muted small">Current mahadasha</span>
          <strong>{current?.lord ?? "Outside displayed range"}</strong>
        </div>
        <div>
          <span className="muted small">Balance at birth</span>
          <strong>
            {(
              (periods[0].end - birth) /
              (chart.settings.yearDays * 86400000)
            ).toFixed(3)}{" "}
            years · {periods[0].lord}
          </strong>
        </div>
        <div>
          <span className="muted small">Year convention</span>
          <strong>{chart.settings.yearDays} days</strong>
        </div>
      </div>
      <div className="period-header">
        <span>Period lord</span>
        <span>Starts · UTC</span>
        <span>Ends · UTC</span>
      </div>
      {periods.map((p) => (
        <PeriodRow
          key={`${chart.utc}-${chart.settings.yearDays}-${p.start}`}
          period={p}
          now={now}
        />
      ))}
    </section>
  );
}
function Parashari({ chart }: { chart: Chart }) {
  const lagna = signOf(chart.ascendant.longitude);
  return (
    <div className="analysis-grid">
      <section className="panel">
        <div className="panel-title">
          <h3>House lordships</h3>
          <span className="pill">Whole sign</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>House</th>
                <th>Sign</th>
                <th>Lord</th>
                <th>Placed in</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => {
                const s = mod(lagna + i, 12),
                  lord = chart.planets.find((p) => p.name === SIGN_LORDS[s])!;
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{SIGNS[s]}</td>
                    <td>{lord.name}</td>
                    <td>
                      House {houseOf(lord.longitude, chart.ascendant.longitude)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h3>Graha drishti</h3>
          <Orbit size={18} />
        </div>
        <div className="aspect-list">
          {chart.planets
            .filter((p) => !["Rahu", "Ketu"].includes(p.name))
            .map((p) => (
              <div key={p.name}>
                <strong>
                  <span className={`planet-dot planet-${p.name.toLowerCase()}`}>
                    {SHORT[p.name]}
                  </span>
                  {p.name}
                </strong>
                <span>
                  {grahaDrishti(p)
                    .map((s) => SIGNS[s])
                    .join(" · ")}
                </span>
              </div>
            ))}
        </div>
      </section>
      <section className="panel span-full">
        <div className="panel-title">
          <h3>Planetary condition</h3>
          <Sparkles size={18} />
        </div>
        <PlanetTable chart={chart} />
      </section>
    </div>
  );
}
function Jaimini({ chart }: { chart: Chart }) {
  const karakas = charaKarakas(chart.planets, chart.settings.karakas),
    lagna = signOf(chart.ascendant.longitude),
    ak = karakas[0].point;
  return (
    <div className="analysis-grid">
      <section className="panel">
        <div className="panel-title">
          <h3>Chara karakas</h3>
          <span className="pill">{chart.settings.karakas}-karaka scheme</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Karaka</th>
                <th>Planet</th>
                <th>Ranking degree</th>
              </tr>
            </thead>
            <tbody>
              {karakas.map((k) => (
                <tr key={k.karaka}>
                  <td>{k.karaka} karaka</td>
                  <td>
                    <span
                      className={`planet-dot planet-${k.point.name.toLowerCase()}`}
                    >
                      {SHORT[k.point.name]}
                    </span>
                    {k.point.name}
                    {k.tied && (
                      <small className="amber-text">
                        Exact tie; ranking unresolved
                      </small>
                    )}
                  </td>
                  <td className="tabular">{angleDms(k.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h3>Jaimini reference points</h3>
          <Sparkles size={18} />
        </div>
        <div className="reference-points">
          <div>
            <span>Atmakaraka</span>
            <strong>{ak.name}</strong>
          </div>
          <div>
            <span>Atmakaraka’s Navamsha sign</span>
            <strong>{SIGNS[vargaSign(ak.longitude, 9)]}</strong>
          </div>
          <div>
            <span>Arudha Lagna · A1</span>
            <strong>{SIGNS[arudha(lagna, chart.planets)]}</strong>
          </div>
          <div>
            <span>Upapada · A12</span>
            <strong>{SIGNS[arudha(mod(lagna + 11, 12), chart.planets)]}</strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h3>Arudha padas</h3>
        </div>
        <div className="arudha-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i}>
              <span className="eyebrow">A{i + 1}</span>
              <strong>
                {SIGNS[arudha(mod(lagna + i, 12), chart.planets)]}
              </strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h3>Rashi drishti</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sign</th>
                <th>Aspects</th>
              </tr>
            </thead>
            <tbody>
              {SIGNS.map((s, i) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>
                    {rashiDrishti(i)
                      .map((x) => SIGNS[x])
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export const DETAIL_TABS = [
  "Overview",
  "Planets",
  "Divisional charts",
  "Dashas",
  "Parashari",
  "Jaimini",
  "Notes",
];
export function ChartDetails({
  chart,
  profile,
  tab,
  onTab,
  onEdit,
}: {
  chart: Chart;
  profile: Profile;
  tab: string;
  onTab: (tab: string) => void;
  onEdit: () => void;
}) {
  const [division, setDivision] = useState(1),
    [selectedVarga, setSelectedVarga] = useState(9);
  const moon = chart.planets.find((p) => p.name === "Moon")!,
    sun = chart.planets.find((p) => p.name === "Sun")!,
    star = mansion(moon.longitude);
  return (
    <>
      <div className="detail-tabs" role="tablist" aria-label="Chart sections">
        {DETAIL_TABS.map((t, index) => (
          <button
            key={t}
            id={`chart-tab-${index}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls="chart-tab-panel"
            tabIndex={tab === t ? 0 : -1}
            className={tab === t ? "selected" : ""}
            onClick={() => onTab(t)}
            onKeyDown={(e) => {
              let next = index;
              if (e.key === "ArrowRight")
                next = (index + 1) % DETAIL_TABS.length;
              else if (e.key === "ArrowLeft")
                next = (index + DETAIL_TABS.length - 1) % DETAIL_TABS.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = DETAIL_TABS.length - 1;
              else return;
              e.preventDefault();
              onTab(DETAIL_TABS[next]);
              document.getElementById(`chart-tab-${next}`)?.focus();
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {profile.certainty === "approximate" && (
        <div className="notice">
          <Info size={17} />
          <span>Approximate birth time</span>
        </div>
      )}
      <div
        role="tabpanel"
        id="chart-tab-panel"
        aria-labelledby={`chart-tab-${DETAIL_TABS.indexOf(tab)}`}
      >
        {tab === "Overview" && (
          <>
            <div className="insight-grid">
              {[
                [
                  "Ascendant",
                  SIGNS[signOf(chart.ascendant.longitude)],
                  dms(chart.ascendant.longitude),
                ],
                [
                  "Moon sign",
                  SIGNS[signOf(moon.longitude)],
                  dms(moon.longitude),
                ],
                ["Sun sign", SIGNS[signOf(sun.longitude)], dms(sun.longitude)],
                [
                  "Birth nakshatra",
                  star.name,
                  `Pada ${star.pada} · ${star.lord}`,
                ],
              ].map(([title, value, sub], i) => (
                <div className="insight" key={title}>
                  <span className="eyebrow">{title}</span>
                  <strong>{value}</strong>
                  <span>{sub}</span>
                  <span className="insight-symbol" aria-hidden="true">
                    {["↗", "☾", "☉", "✧"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="charts-grid">
              <section className="panel chart-panel">
                <div className="panel-title">
                  <div>
                    <h3>{VARGAS.find((v) => v.n === division)?.name}</h3>
                  </div>
                  <DivisionSelect
                    value={division}
                    onChange={setDivision}
                    label="Primary divisional chart"
                  />
                </div>
                <NorthChart chart={chart} division={division} />
                <div className="chart-caption">
                  <span>North Indian · D{division}</span>
                  <span>Numbers indicate signs · R = retrograde</span>
                </div>
              </section>
              <section className="panel chart-panel">
                <div className="panel-title">
                  <div>
                    <h3>Navamsha</h3>
                  </div>
                  <span className="pill">D9</span>
                </div>
                <NorthChart chart={chart} division={9} />
                <button
                  className="chart-footer-link"
                  onClick={() => onTab("Divisional charts")}
                >
                  All divisional charts <ArrowUpRight size={16} />
                </button>
              </section>
            </div>
            <Panchanga chart={chart} />
            <section className="panel">
              <div className="panel-title">
                <h3>Planetary positions</h3>
                <button className="text-link" onClick={() => onTab("Planets")}>
                  View full details <ArrowUpRight size={15} />
                </button>
              </div>
              <PlanetTable chart={chart} compact />
            </section>
          </>
        )}
        {tab === "Planets" && (
          <>
            <section className="panel">
              <div className="panel-title">
                <h3>Planetary positions</h3>
                <span className="pill">
                  Sidereal ·{" "}
                  {
                    AYANAMSAS.find((a) => a.id === chart.settings.ayanamsa)
                      ?.name
                  }
                </span>
              </div>
              <PlanetTable chart={chart} />
            </section>
            <section className="panel technical-table">
              <div className="panel-title">
                <h3>Position details</h3>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Absolute longitude</th>
                      <th>Ecliptic latitude</th>
                      <th>Speed / day</th>
                      <th>Separation from Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.planets.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td className="tabular">{p.longitude.toFixed(8)}°</td>
                        <td className="tabular">{p.latitude.toFixed(6)}°</td>
                        <td className="tabular">{p.speed.toFixed(6)}°</td>
                        <td>
                          {angularDistance(p.longitude, sun.longitude).toFixed(
                            4,
                          )}
                          °
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        {tab === "Divisional charts" && (
          <div className="varga-layout">
            <section className="panel varga-menu">
              <span className="eyebrow">SHODASHAVARGA</span>
              {VARGAS.map((v) => (
                <button
                  key={v.n}
                  className={selectedVarga === v.n ? "selected" : ""}
                  onClick={() => setSelectedVarga(v.n)}
                >
                  <span className="varga-code">D{v.n}</span>
                  <span>
                    <strong>{v.name}</strong>
                    <small>{v.focus}</small>
                  </span>
                </button>
              ))}
            </section>
            <section className="panel chart-panel varga-large">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    D{selectedVarga} · DIVISIONAL CHART
                  </span>
                  <h2>{VARGAS.find((v) => v.n === selectedVarga)?.name}</h2>
                </div>
              </div>
              <NorthChart chart={chart} division={selectedVarga} />
              {selectedVarga >= 40 && (
                <p className="notice small">
                  <Info size={16} />
                  Birth-time sensitive · D{selectedVarga}
                </p>
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Point</th>
                      <th>Natal sign</th>
                      <th>D{selectedVarga} sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[chart.ascendant, ...chart.planets].map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>{SIGNS[signOf(p.longitude)]}</td>
                        <td>
                          {
                            SIGNS[
                              vargaSign(
                                p.longitude,
                                selectedVarga,
                                chart.settings.d60,
                              )
                            ]
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
        {tab === "Dashas" && <Dashas chart={chart} />}
        {tab === "Parashari" && <Parashari chart={chart} />}
        {tab === "Jaimini" && <Jaimini chart={chart} />}
        {tab === "Notes" && (
          <section className="panel notes-panel">
            <div className="panel-title">
              <h3>Your observations</h3>
              <button className="button secondary" onClick={onEdit}>
                Edit notes
              </button>
            </div>
            {profile.notes ? (
              <p className="profile-notes">{profile.notes}</p>
            ) : (
              <div className="empty-notes">
                <Sparkles size={28} />
                <h3>No notes</h3>
                <button className="text-link" onClick={onEdit}>
                  Add a note <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
      </div>
      <details className="calculation-details">
        <summary>
          <Info size={14} />
          Calculation details
        </summary>
        <dl>
          <dt>Engine</dt>
          <dd>{chart.engine}</dd>
          <dt>Birth instant · UTC</dt>
          <dd>{chart.utc}</dd>
          <dt>Local UTC offset</dt>
          <dd>{chart.utcOffset}</dd>
          <dt>Julian day · UT</dt>
          <dd>{chart.julianDay.toFixed(8)}</dd>
          <dt>Ayanamsa</dt>
          <dd>
            {AYANAMSAS.find((a) => a.id === chart.settings.ayanamsa)?.name} ·{" "}
            {angleDms(chart.ayanamsa)}
          </dd>
          <dt>Coordinates</dt>
          <dd>
            {profile.latitude}°, {profile.longitude}°
          </dd>
          <dt>Houses / nodes</dt>
          <dd>Whole sign / {chart.settings.nodes}</dd>
        </dl>
      </details>
    </>
  );
}
