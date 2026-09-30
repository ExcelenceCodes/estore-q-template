import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { db } = await import("@/lib/db.server");
        const client = db();

        const [services, articles, photos] = await Promise.all([
          client.from("services").select("slug,updated_at").eq("published", true),
          client.from("articles").select("slug,updated_at").eq("status", "published"),
          client.from("gallery_photos").select("id").limit(1),
        ]);

        const urls: { loc: string; lastmod?: string; priority: string }[] = [
          { loc: "/", priority: "1.0" },
          { loc: "/about-us", priority: "0.8" },
          { loc: "/services", priority: "0.9" },
          { loc: "/contacts", priority: "0.8" },
        ];

        if ((articles.data ?? []).length) urls.push({ loc: "/blog", priority: "0.9" });
        if ((photos.data ?? []).length) urls.push({ loc: "/gallery", priority: "0.7" });

        for (const s of services.data ?? [])
          urls.push({ loc: `/services/${s.slug}`, lastmod: s.updated_at, priority: "0.8" });
        for (const a of articles.data ?? [])
          urls.push({ loc: `/blog/${a.slug}`, lastmod: a.updated_at, priority: "0.7" });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${origin}${u.loc}</loc>${
        u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""
      }<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
