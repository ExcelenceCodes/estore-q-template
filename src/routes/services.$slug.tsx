import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { getService } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { Icon, mediaUrl } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const result = await getService({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: pageTitle("Service") }, { name: "robots", content: "noindex" }] };
    }
    const title = pageTitle(loaderData.service.title);
    const description = loaderData.service.summary ?? site.seo.defaultDescription;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/services/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/services/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: loaderData.service.title,
            description,
            provider: { "@type": "Organization", name: site.brand.legalName },
            areaServed: site.seo.geo.locality,
          }),
        },
      ],
    };
  },
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service, others } = Route.useLoaderData();
  const image = mediaUrl(service.image_id);

  return (
    <>
      <PageBanner title={service.title} crumb={service.title} image={image} />

      <section className="container-page grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <Reveal>
          <span className="grid h-14 w-14 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon name={service.icon || "briefcase"} size={26} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-black leading-tight sm:text-4xl">
            {service.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{service.summary}</p>

          {service.body ? (
            <div
              className="prose-article mt-8"
              dangerouslySetInnerHTML={{ __html: String(service.body) }}
            />
          ) : null}

          {Array.isArray(service.highlights) && service.highlights.length ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {(service.highlights as string[]).map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm">
                  <Check size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>

        <Reveal delay={120} className="lg:sticky lg:top-40">
          <div className="surface-card p-7">
            <h2 className="font-display text-lg font-bold">Start this service</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send us a message and a consultant will get back to you with the requirements, cost
              and timeline.
            </p>
            <Link
              to="/contacts"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Request a quote <ArrowRight size={16} />
            </Link>
          </div>

          {others.length ? (
            <div className="surface-card mt-5 p-7">
              <h2 className="font-display text-lg font-bold">Other services</h2>
              <ul className="mt-4 space-y-3">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link
                      to="/services/$slug"
                      params={{ slug: o.slug }}
                      className="flex items-start gap-2.5 text-sm transition-colors hover:text-primary"
                    >
                      <Icon
                        name={o.icon || "briefcase"}
                        size={17}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <span>{o.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Reveal>
      </section>
    </>
  );
}
