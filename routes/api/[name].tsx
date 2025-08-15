import type { HandlerContext } from "$fresh/server.ts";

export const handler = {
  GET(ctx: HandlerContext) {
    const name = ctx.params.name;
    return new Response(
      `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
    );
  },
};
