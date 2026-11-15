import { calculateChart, createSwissEph } from "./engine.ts";
import type { Profile, Settings } from "./types.ts";
const FILES: Record<string, string> = {
  "sepl_18.se1":
    "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
  "semo_18.se1":
    "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
};
let engine: ReturnType<typeof initialize> | undefined;
async function initialize() {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([name, checksum]) => {
      const response = await fetch(`/ephemeris/${name}`);
      if (!response.ok)
        throw new Error(
          "Could not download the calculation files. Check your connection and retry.",
        );
      const bytes = await response.arrayBuffer();
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      if (hash !== checksum)
        throw new Error(
          "A calculation file failed its integrity check. Reload the page to retry.",
        );
      return [name, new Uint8Array(bytes)] as const;
    }),
  );
  return createSwissEph({ files: Object.fromEntries(entries) });
}
self.onmessage = async (
  event: MessageEvent<{ id: number; profiles: Profile[]; settings: Settings }>,
) => {
  const { id, profiles, settings } = event.data;
  try {
    engine ??= initialize();
    const swe = await engine;
    // No await within the batch: the instance's sidereal state cannot interleave with another batch.
    const charts = profiles.map((p) => calculateChart(swe, p, settings));
    self.postMessage({ id, charts });
  } catch (error) {
    engine = undefined;
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "Calculation failed",
    });
  }
};
