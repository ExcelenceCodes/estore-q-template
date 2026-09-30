import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { site, pageTitle } from "@/lib/site";
import { listArticles, listRecentArticles } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { imageOf } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

const searchSchema = z.object({
  q: z.string().max(120).optional(),
  page: z.number().int().min(1).max(500).optional(),
});

export const Route = createFileRoute("/blog/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const input: { q?: string; page?: number } = {};
    if (deps.q) input.q = deps.q;
    if (deps.page) input.page = deps.page;
    return { list: await listArticles({ data: input }), recent: await listRecentArticles() };
  },
  head: () => {
    const title = pageTitle("Blog");
    const description = `Guides and updates on company registration, licensing and doing business, from ${site.brand.legalName}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/blog" },
      ],
      links: [{ rel: "canonical", href: "/blog" }],
    };
  },
  component: BlogIndex,
});

function fmt(d?: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";
}

function BlogIndex() {
  const { list, recent } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(search.q ?? "");

  const page = list.page;
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <>
      <PageBanner title="Blog" crumb="Blog" />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div>
          {list.rows.length === 0 ? (
            <p className="surface-card p-8 text-sm text-muted-foreground">
              No articles match your search.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {list.rows.map((a, i) => (
                <Reveal as="li" key={a.slug} delay={i * 60}>
                  <article className="surface-card h-full overflow-hidden">
                    {imageOf(a.cover_id, a.cover_url) ? (
                      <Link
                        to="/blog/$slug"
                        params={{ slug: a.slug }}
                        className="block overflow-hidden"
                      >
                        <img
                          src={imageOf(a.cover_id, a.cover_url) as string}
                          alt={a.title}
                          loading="lazy"
                          decoding="async"
                          className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </Link>
                    ) : null}
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {fmt(a.published_at)}
                        {a.author ? ` · ${a.author}` : ""}
                      </p>
                      <h2 className="mt-2 font-display text-lg font-bold leading-snug">
                        <Link
                          to="/blog/$slug"
                          params={{ slug: a.slug }}
                          className="hover:text-primary"
                        >
                          {a.title}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {a.excerpt}
                      </p>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: a.slug }}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                      >
                        Read article <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          )}

          {pages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <Link
                to="/blog"
                search={(prev) => ({ ...prev, page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm aria-disabled:opacity-40"
              >
                <ArrowLeft size={15} /> Prev
              </Link>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  to="/blog"
                  search={(prev) => ({ ...prev, page: p })}
                  className={`rounded-md px-3.5 py-2 text-sm font-semibold ${
                    p === page ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                to="/blog"
                search={(prev) => ({ ...prev, page: Math.min(pages, page + 1) })}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm aria-disabled:opacity-40"
              >
                Next <ArrowRight size={15} />
              </Link>
            </nav>
          ) : null}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-40">
          <form
            className="surface-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: { q: term.trim() || undefined, page: 1 } });
            }}
          >
            <label htmlFor="blog-search" className="font-display text-base font-bold">
              Search articles
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="blog-search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. work permits"
                maxLength={120}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
              >
                <Search size={17} />
              </button>
            </div>
            {search.q ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {list.total} result{list.total === 1 ? "" : "s"} for &ldquo;{search.q}&rdquo;
              </p>
            ) : null}
          </form>

          {recent.length ? (
            <div className="surface-card p-6">
              <h2 className="font-display text-base font-bold">Recent posts</h2>
              <ul className="mt-4 space-y-3">
                {recent.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: r.slug }}
                      className="text-sm font-medium leading-snug transition-colors hover:text-primary"
                    >
                      {r.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{fmt(r.published_at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
