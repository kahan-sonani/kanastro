import type { Chart, Profile, Settings } from "./types.ts";
let worker: Worker | undefined,
  sequence = 0;
const pending = new Map<
  number,
  {
    resolve: (charts: Chart[]) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function compute(
  profiles: Profile[],
  settings: Settings,
): Promise<Chart[]> {
  if (!worker) {
    worker = new Worker(new URL("./calculator.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.id);
      if (!task) return;
      clearTimeout(task.timer);
      pending.delete(data.id);
      if (data.error) task.reject(new Error(data.error));
      else task.resolve(data.charts);
    };
    worker.onerror = () => {
      for (const task of pending.values()) {
        clearTimeout(task.timer);
        task.reject(
          new Error(
            "The calculation engine could not start. Reload the page and try again.",
          ),
        );
      }
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(
        new Error(
          "Loading the calculation engine took too long. Check your connection and retry.",
        ),
      );
    }, 45000);
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, profiles, settings });
  });
}
