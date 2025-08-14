import { defineConfig } from "$fresh.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwind()],
  build: {
    target: ["chrome99", "firefox99", "safari15"],
  },
});
