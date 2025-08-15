import { PageProps } from "$fresh/server.ts";

export interface State {
  title: string;
}

// Simple helper for page definitions that matches the original define.page pattern
export const define = {
  page: (component: (props: PageProps<unknown, State>) => any) => component,
};
