import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { intlayer } from "vite-intlayer";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

import { metadataRoutes } from './src/lib/seo.js';

const metadataPreview = {
  name: 'metadata-preview',
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = new URL(req.url, 'http://localhost');
      const route = url.pathname.replace(/\/+$/, '') || '/';
      if (route !== '/' && metadataRoutes.includes(route)) {
        req.url = route + '/index.html' + url.search;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [metadataPreview, react(), tailwindcss(), intlayer()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@content": path.resolve(__dirname, "./src/content"),
      "@layout": path.resolve(__dirname, "./src/layout"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./tests/setup.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "src/**/*.test.{js,jsx,ts,tsx}"],
    },
  },
});
