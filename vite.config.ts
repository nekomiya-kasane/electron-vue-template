// configuration entrance for Vite
import { defineConfig } from "vite";
// this plugin interprets the .vue files
import vue from "@vitejs/plugin-vue";
// this plugin builds electron-related source files
import electron from "vite-plugin-electron";
// this plugin supports the renderer process to use node.js runtime APIs
import renderer from "vite-plugin-electron-renderer";

import path from "path"; // Node.js path module
import { fileURLToPath } from "url";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// additional plugins
// this plugin checks typescript and vue files
import checker from "vite-plugin-checker";
// this plugin enables vue devtools
import vueDevtools from "vite-plugin-vue-devtools";
// this plugin allows inspecting vue component in the browser (by clicking the component or something)
import inspector from "vite-plugin-vue-inspector";

export default defineConfig(({ mode }) => ({
  // mode: 'development' | 'production'
  server: {
    port: 12543,
  },
  build: {
    sourcemap: true,
    minify: mode === "production",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        compact: mode === "production",
        comments: mode === "production" ? false : "all",
        // Monaco Editor workers
        manualChunks: {
          'monaco-editor': ['monaco-editor']
        }
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor']
  },
  plugins: [
    vue({
      include: [/\.vue$/],
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "electron-api",
          whitespace: "preserve",
          comments: true,
          delimiters: ["{{", "}}"],
          directiveTransforms: {},
          nodeTransforms: [],
        },
      },
      script: {
        babelParserPlugins: [
          "decorators",
          "classProperties",
          "typescript",
          "jsx",
        ],
        propsDestructure: true,
        globalTypeFiles: ["node_modules/@types/node/index.d.ts"],
        hoistStatic: true,
      },
      style: {
        trim: false,
      },
      features: {
        customElement: false,
        optionsAPI: true,
      },
    }),
    electron([
      {
        entry: "electron/main.ts",
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            sourcemap: true,
            minify: mode === "production" ? "esbuild" : false,
            cssMinify: mode === "production" ? "esbuild" : false,
            rollupOptions: {
              external: ["electron"]
            },
            watch: {},
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            sourcemap: true,
            minify: mode === "production" ? "esbuild" : false,
            cssMinify: mode === "production" ? "esbuild" : false,
            watch: {},
          },
        },
      },
    ]),
    renderer({
    }),

    // additional
    checker({
      typescript: true,
      vueTsc: true,
      overlay: {
        initialIsOpen: true,
        position: "tr",
        badgeStyle: "bg-red-500",
        panelStyle: "bg-red-500",
      },
    }),
    vueDevtools(),
    inspector({
      toggleButtonVisibility: "always",
      toggleComboKey: "ctrl", // Ctrl + Click to toggle
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
