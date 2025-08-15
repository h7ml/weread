import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  build: {
    target: ["chrome99", "firefox99", "safari15"],
  },
});
