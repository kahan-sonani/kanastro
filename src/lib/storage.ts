import { createClient } from "@supabase/supabase-js";
import { validateProfile, validateSettings } from "../astro/birth.ts";
import { DEFAULT_SETTINGS } from "../astro/types.ts";
import type { Profile, Settings } from "../astro/types.ts";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
export async function googleProviderEnabled(): Promise<boolean> {
  if (!supabase) return false;
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Sign-in is temporarily unavailable.");
  const settings = await response.json();
  return settings.external?.google === true;
}

let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  return (dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("kanastro-v1", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("profiles", { keyPath: "id" });
      request.result.createObjectStore("preferences");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = undefined;
      reject(
        new Error(
          "Local storage is unavailable. Allow site storage or use a different browser.",
        ),
      );
    };
  }));
}
async function localRead<T>(store: string, key?: string): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, "readonly"),
      bucket = transaction.objectStore(store);
    const request = key === undefined ? bucket.getAll() : bucket.get(key);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(new Error("Could not read local storage."));
  });
}
async function localWrite(
  store: string,
  action: (store: IDBObjectStore) => void,
): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    action(transaction.objectStore(store));
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () =>
      reject(
        new Error(
          "Changes could not be saved on this device. Export your profiles and check available storage.",
        ),
      );
  });
}
export async function listProfiles(owner: string | null): Promise<Profile[]> {
  if (!owner)
    return (await localRead<Profile[]>("profiles")).map(validateProfile);
  const { data, error } = await supabase!
    .from("kundli_profiles")
    .select("record")
    .eq("owner_id", owner)
    .order("updated_at", { ascending: false });
  if (error)
    throw new Error(`Cloud profiles could not be loaded: ${error.message}`);
  return data.map((row) => validateProfile(row.record));
}
export async function saveProfile(
  profile: Profile,
  owner: string | null,
  previous?: Profile,
): Promise<void> {
  const valid = validateProfile(profile);
  if (!owner) {
    const db = await database();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("profiles", "readwrite");
      const store = tx.objectStore("profiles");
      let conflict = false;
      const request = store.get(valid.id);
      request.onsuccess = () => {
        const current = request.result as Profile | undefined;
        if (
          (previous &&
            (!current || current.updatedAt !== previous.updatedAt)) ||
          (!previous && current)
        ) {
          conflict = true;
          tx.abort();
          return;
        }
        store.put(valid);
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () =>
        reject(
          new Error(
            conflict
              ? "This profile changed in another tab. Reload it before editing."
              : "The profile could not be saved on this device.",
          ),
        );
    });
  }
  if (previous) {
    const { data, error } = await supabase!
      .from("kundli_profiles")
      .update({ record: valid, updated_at: valid.updatedAt })
      .eq("id", profile.id)
      .eq("owner_id", owner)
      .eq("updated_at", previous.updatedAt)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data.length)
      throw new Error(
        "This profile changed on another device. Reload it before editing.",
      );
  } else {
    const { error } = await supabase!.from("kundli_profiles").insert({
      id: valid.id,
      owner_id: owner,
      record: valid,
      updated_at: valid.updatedAt,
    });
    if (error) throw new Error(error.message);
  }
}
export async function deleteProfile(id: string, owner: string | null) {
  if (!owner)
    return localWrite("profiles", (store) => {
      store.delete(id);
    });
  const { error } = await supabase!
    .from("kundli_profiles")
    .delete()
    .eq("id", id)
    .eq("owner_id", owner);
  if (error) throw new Error(error.message);
}
export async function importProfiles(
  profiles: Profile[],
  owner: string | null,
) {
  if (profiles.length > 1000)
    throw new Error("Import at most 1,000 profiles at a time.");
  const existing = await listProfiles(owner),
    ids = new Set(existing.map((p) => p.id));
  const incoming = profiles.map(validateProfile).filter((p) => !ids.has(p.id));
  if (new Set(incoming.map((p) => p.id)).size !== incoming.length)
    throw new Error("The import contains duplicate IDs.");
  if (!incoming.length) return 0;
  if (!owner)
    await localWrite("profiles", (store) => {
      // add() aborts the transaction on a concurrent duplicate instead of overwriting an existing profile.
      incoming.forEach((p) => store.add(p));
    });
  else {
    const { error } = await supabase!.from("kundli_profiles").insert(
      incoming.map((p) => ({
        id: p.id,
        owner_id: owner,
        record: p,
        updated_at: p.updatedAt,
      })),
    );
    if (error) throw new Error(error.message);
  }
  return incoming.length;
}
export async function loadSettings(owner: string | null): Promise<Settings> {
  if (!owner) {
    const s = await localRead<Settings | undefined>("preferences", "settings");
    return s ? validateSettings(s) : DEFAULT_SETTINGS;
  }
  const { data, error } = await supabase!
    .from("account_preferences")
    .select("settings")
    .eq("owner_id", owner)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? validateSettings(data.settings) : DEFAULT_SETTINGS;
}
export async function saveSettings(settings: Settings, owner: string | null) {
  const valid = validateSettings(settings);
  if (!owner)
    return localWrite("preferences", (store) => {
      store.put(valid, "settings");
    });
  const { error } = await supabase!
    .from("account_preferences")
    .upsert({ owner_id: owner, settings: valid });
  if (error) throw new Error(error.message);
}
export function exportData(profiles: Profile[], settings: Settings) {
  const content = JSON.stringify(
    {
      format: "kanastro",
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      profiles,
    },
    null,
    2,
  );
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `kanastro-profiles-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
