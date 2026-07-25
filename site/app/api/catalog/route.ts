import { loadLatestCatalog, REPOSITORY_URL } from "@/lib/repository";

export async function GET() {
  const { catalog, source } = await loadLatestCatalog();
  return Response.json(
    {
      catalog,
      source,
      repository: REPOSITORY_URL,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
