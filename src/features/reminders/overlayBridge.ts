import type { ReminderLevel } from "../../types";

export interface OverlayPayload {
  level: ReminderLevel | "ACKNOWLEDGED";
}

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function updateOverlay(level: ReminderLevel | "ACKNOWLEDGED"): Promise<void> {
  if (!isTauri()) return;
  try {
    const [{ emitTo }, { getAllWebviewWindows }] = await Promise.all([
      import("@tauri-apps/api/event"),
      import("@tauri-apps/api/webviewWindow"),
    ]);
    const overlay = (await getAllWebviewWindows()).find((window) => window.label === "overlay");
    if (!overlay) return;
    await emitTo("overlay", "veya-overlay", { level } satisfies OverlayPayload);
    if (level === "NONE") {
      await overlay.hide();
    } else {
      await overlay.show();
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn("Overlay bridge unavailable", error);
  }
}

