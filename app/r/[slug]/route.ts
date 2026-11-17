import { REGISTRY_ITEMS } from "@/src/registry/generated";

export const dynamic = "force-dynamic";

/**
 * Self-hosted shadcn registry.
 *
 *   GET /r/button.json  ->  registry-item JSON for the Button component
 *
 * Sibling component imports become absolute registryDependencies on this origin,
 * so `npx shadcn@latest add http://localhost:3000/r/chat-composer.json` pulls the
 * whole tree in one command.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.json$/, "");
  const item = REGISTRY_ITEMS[slug];

  if (!item) {
    return Response.json(
      {
        error: `Unknown registry item: ${slug}`,
        available: Object.keys(REGISTRY_ITEMS),
      },
      { status: 404 },
    );
  }

  const origin = new URL(request.url).origin;

  return Response.json(
    {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      ...item,
      registryDependencies: item.registryDependencies.map((dependency) => `${origin}/r/${dependency}.json`),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
