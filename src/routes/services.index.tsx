import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { listServices } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

export const Route = createFileRoute("/services/")({
  loader: () => listServices(),
  head: () => {
    const title = pageTitle("Our Services");
    const description = `Company registration, licensing, permits and advisory services from ${site.brand.legalName}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/services" },
      ],
      links: [{ rel: "canonical", href: "/services" }],
    };
  },
  component: ServicesPage,
});

function ServicesPage() {
  const services = Route.useLoaderData();

  return (
    <>
      <PageBanner title="Our Services" crumb="Our Services" />
      <section className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 70}>
              <Link
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="surface-card group flex h-full flex-col p-7 transition-transform hover:-translate-y-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon name={s.icon || "briefcase"} size={22} />
                </span>
                <h2 className="mt-5 font-display text-lg font-bold">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.summary}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Learn more
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
