import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin que marca los archivos de vite como externos (no los bundlea)
const viteExternalPlugin = {
  name: "vite-external",
  setup(build) {
    // Marcar vite.ts como externo (dynamic import en runtime)
    build.onResolve({ filter: /\/vite$/ }, (args) => {
      if (args.importer && args.importer.includes("server")) {
        return { path: args.path, external: true };
      }
    });

    // Marcar vite.config como externo
    build.onResolve({ filter: /vite\.config/ }, () => {
      return { path: "vite.config.ts", external: true };
    });

    // Marcar todos los paquetes de vite plugins como externos
    build.onResolve(
      {
        filter:
          /^(vite|@vitejs|@builder\.io\/vite|vite-plugin|@tailwindcss\/vite)/,
      },
      (args) => {
        return { path: args.path, external: true };
      }
    );
  },
};

await build({
  entryPoints: ["server/_core/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
  plugins: [viteExternalPlugin],
  logLevel: "info",
});

console.log("✅ Server build complete");
