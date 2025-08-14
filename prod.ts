#!/usr/bin/env -S deno serve -A --unstable-kv --unstable-cron
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();

if (import.meta.main) {
  app.listen();
}
