import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Cloud,
  Download,
  Ellipsis,
  FileText,
  GitCompareArrows,
  LayoutGrid,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { compute } from "./astro/client";
import { DEFAULT_SETTINGS, SIGNS, AYANAMSAS } from "./astro/types";
import type { Chart, Profile, Settings } from "./astro/types";
import { dms, mansion, signOf, vargaSign, VARGAS } from "./astro/rules";
import {
  deleteProfile,
  exportData,
  googleProviderEnabled,
  importProfiles,
  listProfiles,
  loadSettings,
  saveProfile,
  saveSettings,
  supabase,
} from "./lib/storage";
import { ProfileForm } from "./components/ProfileForm";
import { SettingsForm } from "./components/SettingsForm";
import { SelectControl } from "./components/SelectControl";
import { SearchInput } from "./components/SearchInput";
import { ActionMenu } from "./components/ActionMenu";
import { Modal } from "./components/Modal";
import { NorthChart } from "./components/NorthChart";
import {
  ChartDetails,
  dateLabel,
  DivisionSelect,
} from "./components/ChartDetails";

const EXAMPLE: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Example chart",
  date: "1990-05-15",
  time: "14:30:00",
  place: "Jaipur, IN",
  latitude: 26.91962,
  longitude: 75.78781,
  timeZone: "Asia/Kolkata",
  certainty: "exact",
  disambiguation: "reject",
  notes: "Illustrative birth details. This is not a saved profile.",
  createdAt: "2026-11-15T00:00:00Z",
  updatedAt: "2026-11-15T00:00:00Z",
};
type Mode = "library" | "chart" | "compare" | "settings";
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 720px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("kanastro-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("kanastro-theme", theme);
    } catch {
      /* Theme still works without persistence. */
    }
  }, [theme]);
  const [session, setSession] = useState<Session | null>(null),
    [authReady, setAuthReady] = useState(!supabase);
  const [profiles, setProfiles] = useState<Profile[]>([]),
    [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS),
    [dataReady, setDataReady] = useState(false);
  const [mode, setMode] = useState<Mode>("library"),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("recent"),
    [mobileMenu, setMobileMenu] = useState(false);
  const [form, setForm] = useState<Profile | "new" | null>(null),
    [accountOpen, setAccountOpen] = useState(false),
    [deleting, setDeleting] = useState<Profile | null>(null);
  const [comparePicker, setComparePicker] = useState(false),
    [comparisonIds, setComparisonIds] = useState<string[]>([]),
    [draftIds, setDraftIds] = useState<string[]>([]),
    [division, setDivision] = useState(1);
  const [charts, setCharts] = useState<Chart[]>([]),
    [calculating, setCalculating] = useState(false),
    [calculationError, setCalculationError] = useState(""),
    [retry, setRetry] = useState(0);
  const [googleReady, setGoogleReady] = useState(false),
    [accountError, setAccountError] = useState("");
  useEffect(() => {
    if (!accountOpen || session) return;
    let live = true;
    setGoogleReady(false);
    setAccountError("");
    googleProviderEnabled()
      .then((ready) => {
        if (live) {
          setGoogleReady(ready);
          if (!ready) setAccountError("Google sign-in is not configured.");
        }
      })
      .catch((e) => {
        if (live) setAccountError(messageOf(e));
      });
    return () => {
      live = false;
    };
  }, [accountOpen, session]);
  const [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const owner = session?.user.id ?? null;
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  useEffect(() => {
    if (!isMobile || !mobileMenu) return;
    document.getElementById("close-mobile-navigation")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenu(false);
        document.getElementById("open-mobile-navigation")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [isMobile, mobileMenu]);
  const active =
    selectedId === EXAMPLE.id
      ? EXAMPLE
      : profiles.find((p) => p.id === selectedId);
  const compared = comparisonIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter((p): p is Profile => !!p);
  const isExample = selectedId === EXAMPLE.id;
  const ayaName = AYANAMSAS.find((a) => a.id === settings.ayanamsa)?.name;

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (live) {
        if (error) setError(error.message);
        setSession(data.session);
        setAuthReady(true);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (live) {
        setSession(next);
        setAuthReady(true);
      }
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!authReady) return;
    let live = true;
    setDataReady(false);
    setProfiles([]);
    setCharts([]);
    setSelectedId(null);
    setComparisonIds([]);
    setMode("library");
    setForm(null);
    setComparePicker(false);
    setDeleting(null);
    Promise.all([listProfiles(owner), loadSettings(owner)])
      .then(([p, s]) => {
        if (live) {
          setProfiles(p);
          setSettings(s);
          setDataReady(true);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(messageOf(e));
      });
    return () => {
      live = false;
    };
  }, [owner, authReady]);
  const calculationKey = JSON.stringify({
    mode,
    profiles:
      mode === "chart" && active
        ? [active]
        : mode === "compare"
          ? compared
          : [],
    settings,
    retry,
  });
  useEffect(() => {
    let live = true;
    const targets =
      mode === "chart" && active
        ? [active]
        : mode === "compare"
          ? compared
          : [];
    setCharts([]);
    setCalculationError("");
    if (!targets.length) {
      setCalculating(false);
      return;
    }
    setCalculating(true);
    compute(targets, settings)
      .then((result) => {
        if (live) setCharts(result);
      })
      .catch((e) => {
        if (live) setCalculationError(messageOf(e));
      })
      .finally(() => {
        if (live) setCalculating(false);
      });
    return () => {
      live = false;
    };
  }, [calculationKey]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function refresh() {
    const loaded = await listProfiles(owner);
    if (ownerRef.current !== owner) return false;
    setProfiles(loaded);
    return true;
  }
  async function storeProfile(p: Profile, previous?: Profile) {
    await saveProfile(p, owner, previous);
    if (!(await refresh())) return;
    setSelectedId(p.id);
    setMode("chart");
    setToast(previous ? "Profile updated" : "Profile created");
  }
  function openProfile(id: string) {
    setSelectedId(id);
    setTab("Overview");
    setMode("chart");
    setMobileMenu(false);
  }
  function startCompare() {
    const selected = comparisonIds.filter((id) =>
      profiles.some((p) => p.id === id),
    );
    setDraftIds(
      selected.length >= 2
        ? selected
        : [selectedId, ...profiles.map((p) => p.id)]
            .filter(
              (id, i, all): id is string =>
                !!id && id !== EXAMPLE.id && all.indexOf(id) === i,
            )
            .slice(0, 2),
    );
    setComparePicker(true);
    setMobileMenu(false);
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Choose a Kanastro JSON export smaller than 5 MB.");
      const parsed = JSON.parse(await file.text());
      if (
        parsed.format !== "kanastro" ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.profiles)
      )
        throw new Error("This is not a supported Kanastro profile export.");
      const count = await importProfiles(parsed.profiles, owner);
      if (!(await refresh())) return;
      setToast(
        `${count} profile${count === 1 ? "" : "s"} imported. Existing profiles were preserved.`,
      );
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
      if (importInput.current) importInput.current.value = "";
    }
  }
  async function googleSignIn() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) {
      setAccountError(error.message);
      setBusy(false);
    }
  }
  const visibleProfiles = profiles
    .filter((p) =>
      `${p.name} ${p.place}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.updatedAt.localeCompare(a.updatedAt),
    );

  return (
    <div className={`app-shell ${collapsed ? "sidebar-is-collapsed" : ""}`}>
      <input
        ref={importInput}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
        }}
      />
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        id="main-sidebar"
        inert={isMobile && !mobileMenu}
        aria-hidden={isMobile && !mobileMenu ? true : undefined}
        className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-header">
          <button
            className="brand"
            onClick={() => {
              setMode("library");
              setMobileMenu(false);
            }}
            aria-label="Kanastro home"
          >
            <span className="brand-symbol">✧</span>
            <span className="brand-word">
              kanastro<span className="brand-dot">.</span>
            </span>
          </button>
          <button
            id="close-mobile-navigation"
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => {
              setMobileMenu(false);
              document.getElementById("open-mobile-navigation")?.focus();
            }}
          >
            <X size={19} />
          </button>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button
            aria-label="My profiles"
            title="My profiles"
            className={mode === "library" || mode === "chart" ? "active" : ""}
            onClick={() => {
              setMode("library");
              setMobileMenu(false);
            }}
          >
            <LayoutGrid size={19} />
            <span className="nav-label">My profiles</span>
            <span className="nav-count">{profiles.length}</span>
          </button>
          <button
            aria-label="Compare charts"
            title="Compare charts"
            className={mode === "compare" ? "active" : ""}
            onClick={startCompare}
            disabled={!dataReady}
          >
            <GitCompareArrows size={19} />
            <span className="nav-label">Compare charts</span>
          </button>
          <button
            aria-label="Calculation settings"
            title="Calculation settings"
            className={mode === "settings" ? "active" : ""}
            onClick={() => {
              setMode("settings");
              setMobileMenu(false);
            }}
            disabled={!dataReady}
          >
            <Settings2 size={19} />
            <span className="nav-label">Calculation settings</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="sidebar-collapse"
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="main-sidebar"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
            <span className="nav-label">Collapse sidebar</span>
          </button>
          <button
            className="account-button"
            aria-label="Account and storage"
            title="Account and storage"
            onClick={() => {
              setMobileMenu(false);
              setAccountOpen(true);
            }}
          >
            <span className="account-avatar">
              {session ? (
                initials(
                  session.user.user_metadata.full_name ??
                    session.user.email ??
                    "U",
                )
              ) : (
                <Monitor size={19} />
              )}
            </span>
            <span className="account-copy">
              <strong>
                {session
                  ? (session.user.user_metadata.full_name ?? "Your account")
                  : "Local profiles"}
              </strong>
              <small>
                {session ? "Private cloud storage" : "Saved on this device"}
              </small>
            </span>
          </button>
        </div>
      </aside>
      <div className="main-shell" inert={isMobile && mobileMenu}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              id="open-mobile-navigation"
              className="icon-button mobile-menu-button"
              aria-expanded={mobileMenu}
              aria-controls="main-sidebar"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
            <strong>
              {mode === "library"
                ? "My profiles"
                : mode === "chart"
                  ? (active?.name ?? "Chart")
                  : mode === "compare"
                    ? "Compare charts"
                    : "Calculation settings"}
            </strong>
          </div>
          <div className="topbar-right">
            <button
              className="icon-button theme-toggle"
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              title={theme === "light" ? "Dark mode" : "Light mode"}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
          </div>
        </header>
        <main className="content">
          {error && (
            <div className="error-box global-error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {!dataReady && (
            <section className="panel loading-panel">
              {error ? (
                <>
                  <h3>Profiles could not be loaded</h3>
                  <button
                    className="button secondary"
                    onClick={() => window.location.reload()}
                  >
                    Retry loading
                  </button>
                </>
              ) : (
                <>
                  <LoaderCircle className="spin" size={25} />
                  <p>Loading profiles…</p>
                </>
              )}
            </section>
          )}
          {dataReady && mode === "library" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    My profiles<span className="heading-dot">.</span>
                  </h1>
                </div>
                <div className="heading-actions">
                  <button className="button secondary" onClick={startCompare}>
                    <GitCompareArrows size={17} />
                    Compare
                  </button>
                  <button
                    className="button primary"
                    onClick={() => setForm("new")}
                  >
                    <Plus size={18} />
                    New profile
                  </button>
                </div>
              </div>
              <div className="library-toolbar">
                <div className="library-tabs">
                  <span>All profiles</span>
                  <span className="pill">{profiles.length}</span>
                </div>
                <div className="library-tools">
                  <SearchInput value={search} onChange={setSearch} />
                  <SelectControl
                    label="Sort profiles"
                    className="sort-select"
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: "recent", label: "Recently updated" },
                      { value: "name", label: "Name A–Z" },
                    ]}
                  />
                  <ActionMenu
                    label="Import and export"
                    actions={[
                      {
                        label: "Import profiles",
                        icon: <Upload size={15} />,
                        disabled: busy,
                        onSelect: () => importInput.current?.click(),
                      },
                      {
                        label: "Export all profiles",
                        icon: <Download size={15} />,
                        disabled: !profiles.length,
                        onSelect: () => exportData(profiles, settings),
                      },
                    ]}
                  />
                </div>
              </div>
              {profiles.length === 0 ? (
                <section className="empty-library">
                  <div className="empty-symbol">
                    <BookOpen size={27} />
                  </div>
                  <h3>No profiles yet</h3>
                  <div className="empty-actions">
                    <button
                      className="text-link"
                      onClick={() => importInput.current?.click()}
                    >
                      Import
                    </button>
                    <button
                      className="text-link"
                      onClick={() => openProfile(EXAMPLE.id)}
                    >
                      View example <ArrowUpRight size={14} />
                    </button>
                  </div>
                </section>
              ) : visibleProfiles.length === 0 ? (
                <section className="empty-library">
                  <Search size={28} />
                  <h3>No profiles found</h3>
                  <button className="text-link" onClick={() => setSearch("")}>
                    Clear search
                  </button>
                </section>
              ) : (
                <div className="profile-grid">
                  {visibleProfiles.map((p, i) => (
                    <article className="profile-card" key={p.id}>
                      <div className="profile-card-top">
                        <button
                          className={`profile-avatar avatar-${i % 4}`}
                          onClick={() => openProfile(p.id)}
                          aria-label={`Open ${p.name}`}
                        >
                          {initials(p.name)}
                        </button>
                        <ActionMenu
                          label={`Actions for ${p.name}`}
                          actions={[
                            {
                              label: "Edit profile",
                              icon: <Pencil size={15} />,
                              onSelect: () => setForm(p),
                            },
                            {
                              label: "Export profile",
                              icon: <Download size={15} />,
                              onSelect: () => exportData([p], settings),
                            },
                            {
                              label: "Delete profile",
                              icon: <Trash2 size={15} />,
                              danger: true,
                              onSelect: () => setDeleting(p),
                            },
                          ]}
                        />
                      </div>
                      <button
                        className="profile-title"
                        onClick={() => openProfile(p.id)}
                      >
                        {p.name}
                      </button>
                      <div className="profile-meta">
                        <span>
                          {dateLabel(p.date)} · {p.time.slice(0, 5)}
                        </span>
                        <span>{p.place}</span>
                      </div>
                      <div className="profile-card-footer">
                        <span className="small muted">
                          {p.certainty === "approximate"
                            ? "Approximate birth time"
                            : "Birth profile"}
                        </span>
                        <button
                          className="text-link"
                          onClick={() => openProfile(p.id)}
                        >
                          View chart <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                  <button
                    className="add-profile-card"
                    onClick={() => setForm("new")}
                  >
                    <span>
                      <Plus size={24} />
                    </span>
                    <strong>Add another profile</strong>
                  </button>
                </div>
              )}
            </>
          )}
          {dataReady && mode === "chart" && active && (
            <>
              <button className="back-link" onClick={() => setMode("library")}>
                <ArrowLeft size={15} />
                All profiles
              </button>
              <div className="page-heading profile-page-heading">
                <div className="profile-heading-identity">
                  <span className="profile-avatar avatar-0">
                    {initials(active.name)}
                  </span>
                  <div>
                    <div className="profile-title-line">
                      <h1>{active.name}</h1>
                      {isExample && (
                        <span className="pill">Example · not saved</span>
                      )}
                    </div>
                    <p>
                      {dateLabel(active.date)} · {active.time} · {active.place}
                    </p>
                  </div>
                </div>
                <div className="heading-actions">
                  {!isExample && (
                    <button
                      className="button secondary"
                      onClick={() => setForm(active)}
                    >
                      <Pencil size={15} />
                      Edit profile
                    </button>
                  )}
                  <button className="button secondary" onClick={startCompare}>
                    <GitCompareArrows size={17} />
                    Compare
                  </button>
                  <button
                    className="icon-button bordered"
                    aria-label="Print chart"
                    onClick={() => window.print()}
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
              <div className="calculation-strip">
                <span>
                  <span className="status-dot" />
                  {ayaName} ayanamsa
                </span>
                <span>Whole-sign houses</span>
                <span>{settings.nodes === "mean" ? "Mean" : "True"} nodes</span>
                <button onClick={() => setMode("settings")}>
                  <Settings2 size={14} />
                  Settings
                </button>
              </div>
              {calculating && (
                <div className="panel loading-panel">
                  <LoaderCircle size={28} className="spin" />
                  <h3>Calculating…</h3>
                </div>
              )}
              {calculationError && (
                <div className="error-box" role="alert">
                  {calculationError}
                  <button
                    className="button secondary"
                    onClick={() => setRetry((r) => r + 1)}
                  >
                    Retry calculation
                  </button>
                </div>
              )}
              {charts[0] && (
                <ChartDetails
                  key={active.id}
                  chart={charts[0]}
                  profile={active}
                  tab={tab}
                  onTab={setTab}
                  onEdit={() => (isExample ? setForm("new") : setForm(active))}
                />
              )}
            </>
          )}
          {dataReady && mode === "compare" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Compare charts</h1>
                </div>
                <button
                  className="button secondary"
                  onClick={() => {
                    if (active) setMode("chart");
                    else setMode("library");
                  }}
                >
                  <X size={16} />
                  Exit compare
                </button>
              </div>
              <div className="compare-toolbar">
                <div>
                  <DivisionSelect
                    value={division}
                    onChange={setDivision}
                    label="Chart division for all profiles"
                  />
                </div>
                <button className="button secondary" onClick={startCompare}>
                  <Plus size={16} />
                  {compared.length < 4 ? "Add profile" : "Change profiles"}
                </button>
              </div>
              <div
                className="compare-grid"
                style={
                  { "--compare-count": compared.length } as React.CSSProperties
                }
              >
                {compared.map((p) => {
                  const c = charts.find((c) => c.profileId === p.id);
                  return (
                    <section className="panel compare-card" key={p.id}>
                      <div className="compare-person">
                        <span className="profile-avatar avatar-0">
                          {initials(p.name)}
                        </span>
                        <div>
                          <h3>{p.name}</h3>
                          <small>
                            {dateLabel(p.date)} · {p.time.slice(0, 5)}
                          </small>
                          <small>{p.place}</small>
                        </div>
                        {compared.length > 2 && (
                          <button
                            className="icon-button"
                            aria-label={`Remove ${p.name} from comparison`}
                            onClick={() =>
                              setComparisonIds((ids) =>
                                ids.filter((id) => id !== p.id),
                              )
                            }
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {c ? (
                        <>
                          <NorthChart chart={c} division={division} />
                          <div className="compare-facts">
                            <div>
                              <span>Lagna · D{division}</span>
                              <strong>
                                {
                                  SIGNS[
                                    vargaSign(
                                      c.ascendant.longitude,
                                      division,
                                      settings.d60,
                                    )
                                  ]
                                }
                              </strong>
                            </div>
                            <div>
                              <span>Natal Moon nakshatra</span>
                              <strong>
                                {
                                  mansion(
                                    c.planets.find((x) => x.name === "Moon")!
                                      .longitude,
                                  ).name
                                }
                              </strong>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="comparison-loading">
                          {calculating ? (
                            <LoaderCircle size={26} className="spin" />
                          ) : (
                            <span>Calculation unavailable</span>
                          )}
                        </div>
                      )}
                      {p.certainty === "approximate" && (
                        <p className="footnote amber-text">
                          Approximate birth time
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
              {calculationError && (
                <div className="error-box" role="alert">
                  {calculationError}
                  <button
                    className="button secondary"
                    onClick={() => setRetry((r) => r + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}
              {charts.length === compared.length && charts.length > 0 && (
                <section className="panel">
                  <div className="panel-title">
                    <h3>Planetary comparison</h3>
                    <span className="pill">
                      D{division} · {ayaName}
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Point</th>
                          {compared.map((p) => (
                            <th key={p.id}>{p.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "Lagna",
                          "Sun",
                          "Moon",
                          "Mars",
                          "Mercury",
                          "Jupiter",
                          "Venus",
                          "Saturn",
                          "Rahu",
                          "Ketu",
                        ].map((name) => (
                          <tr key={name}>
                            <th>{name}</th>
                            {compared.map((p) => {
                              const c = charts.find(
                                  (c) => c.profileId === p.id,
                                )!,
                                point =
                                  name === "Lagna"
                                    ? c.ascendant
                                    : c.planets.find((x) => x.name === name)!;
                              return (
                                <td key={p.id}>
                                  <strong>
                                    {
                                      SIGNS[
                                        vargaSign(
                                          point.longitude,
                                          division,
                                          settings.d60,
                                        )
                                      ]
                                    }
                                  </strong>
                                  {division === 1 && (
                                    <small className="tabular">
                                      {dms(point.longitude)}
                                      {point.retrograde ? " · R" : ""}
                                    </small>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
          {dataReady && mode === "settings" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    Calculation settings<span className="heading-dot">.</span>
                  </h1>
                </div>
              </div>
              <SettingsForm
                key={owner ?? "local"}
                settings={settings}
                onSave={async (s) => {
                  await saveSettings(s, owner);
                  if (ownerRef.current === owner) setSettings(s);
                }}
              />
            </>
          )}
          <footer className="site-footer">
            <span>kanastro.</span>
            <nav aria-label="Information">
              <a href="/about">About</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </nav>
            <a href="/source/kanastro-source.tar.gz" download>
              Open source · AGPL-3.0 <ArrowUpRight size={12} />
            </a>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {form && (
        <ProfileForm
          profile={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
          onSave={storeProfile}
        />
      )}
      {comparePicker && (
        <Modal
          title="Choose profiles to compare"
          onClose={() => setComparePicker(false)}
        >
          {profiles.length < 2 ? (
            <div className="empty-notes">
              <GitCompareArrows size={30} />
              <h3>
                Add {profiles.length ? "one more profile" : "two profiles"} to
                compare.
              </h3>
              <button
                className="button primary"
                onClick={() => {
                  setComparePicker(false);
                  setForm("new");
                }}
              >
                <Plus size={16} />
                Create a profile
              </button>
            </div>
          ) : (
            <>
              <div className="compare-picker">
                {profiles.map((p) => (
                  <label
                    key={p.id}
                    className={draftIds.includes(p.id) ? "checked" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={draftIds.includes(p.id)}
                      disabled={
                        !draftIds.includes(p.id) && draftIds.length >= 4
                      }
                      onChange={(e) =>
                        setDraftIds((ids) =>
                          e.target.checked
                            ? [...ids, p.id]
                            : ids.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span className="profile-avatar avatar-0">
                      {initials(p.name)}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {dateLabel(p.date)} · {p.place}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="modal-footer">
                <span className="muted small">{draftIds.length} selected</span>
                <button
                  className="button primary"
                  disabled={draftIds.length < 2}
                  onClick={() => {
                    setComparisonIds(draftIds);
                    setMode("compare");
                    setComparePicker(false);
                  }}
                >
                  <GitCompareArrows size={17} />
                  Compare charts
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
          busy={busy}
        >
          <p className="modal-intro">Delete this profile and its notes?</p>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => exportData([deleting], settings)}
            >
              <Download size={16} />
              Export first
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteProfile(deleting.id, owner);
                  if (!(await refresh())) return;
                  if (selectedId === deleting.id) {
                    setSelectedId(null);
                    setMode("library");
                  }
                  setComparisonIds((ids) =>
                    ids.filter((id) => id !== deleting.id),
                  );
                  setDeleting(null);
                  setToast("Profile deleted");
                } catch (e) {
                  setError(messageOf(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete profile"}
            </button>
          </div>
        </Modal>
      )}
      {accountOpen && (
        <Modal
          title="Account"
          onClose={() => setAccountOpen(false)}
          busy={busy}
        >
          <div className="account-intro">
            <div className="empty-symbol">
              {session ? <Cloud size={26} /> : <Monitor size={26} />}
            </div>
            <h3>{session ? "Cloud profiles" : "Local profiles"}</h3>
            <p>{session ? session.user.email : "Saved on this device"}</p>
          </div>
          {session ? (
            <>
              <button
                className="button secondary full-width"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const local = await listProfiles(null);
                    const count = await importProfiles(local, owner);
                    if (!(await refresh())) return;
                    setToast(`${count} local profiles copied to your account.`);
                  } catch (e) {
                    setError(messageOf(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                Copy this device’s local profiles to my account
              </button>
              <button
                className="button secondary full-width"
                onClick={async () => {
                  setBusy(true);
                  const { error } = await supabase!.auth.signOut();
                  if (error) setError(error.message);
                  else setAccountOpen(false);
                  setBusy(false);
                }}
                disabled={busy}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : supabase ? (
            <button
              className="button primary full-width"
              onClick={googleSignIn}
              disabled={busy || !googleReady}
            >
              <LogIn size={17} />
              Continue with Google
            </button>
          ) : (
            <div className="setup-notice">
              <strong>Cloud sync not configured</strong>
              <a
                className="text-link"
                href="/source/kanastro-source.tar.gz"
                download
              >
                Source & setup instructions <ArrowUpRight size={14} />
              </a>
            </div>
          )}
          {accountError && supabase && (
            <p className="account-status" role="status">
              {accountError}
            </p>
          )}
          <button
            className="button secondary full-width"
            disabled={!profiles.length}
            onClick={() => exportData(profiles, settings)}
          >
            <Download size={16} />
            Export my profiles
          </button>
        </Modal>
      )}
    </div>
  );
}
