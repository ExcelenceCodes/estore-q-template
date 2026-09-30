import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "http://localhost:8080/",
  integrations: [react()],
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
