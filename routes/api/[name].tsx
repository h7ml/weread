import type { HandlerContext } from "$fresh/server.ts";

export const handler = (_req: Request, ctx: HandlerContext) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
};
