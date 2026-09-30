import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { getArticle } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { imageOf } from "@/components/site/Icon";
import { markdownToHtml } from "@/lib/markdown";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const result = await getArticle({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: pageTitle("Article") }, { name: "robots", content: "noindex" }] };
    }
    const { article, origin } = loaderData;
    const title = pageTitle(article.title);
    const description = article.excerpt ?? site.seo.defaultDescription;
    const url = `${origin}/blog/${params.slug}`;
    const cover = article.cover_url?.startsWith("http")
      ? article.cover_url
      : article.cover_id
        ? `${origin}/api/public/media/${article.cover_id}`
        : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: (article.tags ?? []).join(", ") },
        { property: "og:title", content: article.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
        { property: "article:published_time", content: article.published_at ?? "" },
        { property: "article:author", content: article.author ?? site.brand.legalName },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description,
            image: cover ?? undefined,
            datePublished: article.published_at,
            dateModified: article.published_at,
            keywords: (article.tags ?? []).join(", "),
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            author: { "@type": "Person", name: article.author ?? site.brand.legalName },
            publisher: {
              "@type": "Organization",
              name: site.brand.legalName,
              logo: { "@type": "ImageObject", url: `${origin}${site.brand.logo}` },
            },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
});

function fmt(d?: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";
}

function ArticlePage() {
  const { article, more } = Route.useLoaderData();
  const cover = imageOf(article.cover_id, article.cover_url);

  return (
    <article className="container-page py-14">
      <Reveal className="mx-auto max-w-3xl">
        <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          {" / "}
          <Link to="/blog" className="hover:text-primary">
            Blog
          </Link>
        </nav>
        <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} /> {fmt(article.published_at)}
          </span>
          {article.author ? (
            <span className="flex items-center gap-1.5">
              <User size={14} /> {article.author}
            </span>
          ) : null}
          {(article.tags ?? []).map((t: string) => (
            <span key={t} className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
              {t}
            </span>
          ))}
        </div>
      </Reveal>

      {cover ? (
        <Reveal className="mx-auto mt-8 max-w-4xl">
          <img
            src={cover}
            alt={article.title}
            className="aspect-[16/8] w-full rounded-xl object-cover"
            decoding="async"
          />
        </Reveal>
      ) : null}

      <Reveal className="prose-article mx-auto mt-10 max-w-3xl" delay={80}>
        {renderRichBody(article.body)}
      </Reveal>

      {more.length ? (
        <section className="mx-auto mt-16 max-w-4xl">
          <h2 className="font-display text-2xl font-black">Keep reading</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {more.map((m, i) => (
              <Reveal as="li" key={m.slug} delay={i * 70}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: m.slug }}
                  className="surface-card block h-full p-5 transition-transform hover:-translate-y-1"
                >
                  <p className="text-xs text-muted-foreground">{fmt(m.published_at)}</p>
                  <h3 className="mt-1.5 font-display text-sm font-bold leading-snug">{m.title}</h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Read <ArrowRight size={13} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function renderRichBody(body: string | null | undefined) {
  if (!body) return null;
  const html = /<[a-z][\s\S]*>/i.test(body) ? body : markdownToHtml(body);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
