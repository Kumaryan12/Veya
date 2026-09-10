import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sites } from "@openai/sites-vite-plugin";

export default defineConfig(async ({ mode }) => {
  const desktop = mode === "desktop";
  const plugins: PluginOption[] = [react(), tailwindcss()];
  if (!desktop && mode !== "test") {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.push(sites(), cloudflare());
  }

  return {
    plugins,
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      watch: { ignored: ["**/src-tauri/**"] },
    },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
    build: desktop ? { target: ["es2021", "chrome100", "safari13"] } : undefined,
  };
});
