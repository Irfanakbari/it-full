import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({ test: { environment: "node", globals: true, exclude: ["test/visual/**", "node_modules/**", ".next/**"] }, resolve: { alias: { "@": path.resolve(import.meta.dirname, "."), "server-only": path.resolve(import.meta.dirname, "test/server-only.ts") } } });
