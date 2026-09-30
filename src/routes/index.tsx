import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Users } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { listServices, listRecentArticles } from "@/lib/public.functions";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { Icon, imageOf } from "@/components/site/Icon";
import { YearsOfExperience } from "@/components/site/YearsOfExperience";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  loader: async () => ({
    services: await listServices(),
    articles: await listRecentArticles(),
  }),
  head: () => ({
    meta: [
      { title: site.seo.defaultTitle },
      { name: "description", content: site.seo.defaultDescription },
      { name: "keywords", content: site.seo.keywords.join(", ") },
      { property: "og:title", content: site.seo.defaultTitle },
      { property: "og:description", content: site.seo.defaultDescription },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const pillars = [
  {
    icon: ShieldCheck,
    title: "Fully compliant",
    body: "Every filing prepared to the exact standard the registrar expects.",
  },
  {
    icon: Clock,
    title: "Faster turnaround",
    body: "Clear timelines and proactive follow-up until your certificate is issued.",
  },
  {
    icon: Users,
    title: "One dedicated team",
    body: "A named consultant owns your file from first call to final approval.",
  },
];

function HomePage() {
  const boot = rootApi.useLoaderData();
  const { services, articles } = Route.useLoaderData();

  return (
    <>
      <Hero hero={boot.hero} />

      <section className="container-page -mt-10 relative z-10 grid gap-4 sm:grid-cols-3">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <div className="surface-card h-full p-6">
              <p.icon className="text-primary" size={26} />
              <h2 className="mt-4 font-display text-base font-bold">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div className="overflow-hidden rounded-xl">
              <img
                src={boot.about?.image}
                alt={`${site.brand.legalName} team at work`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                style={{ maxHeight: "420px" }}
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">About us</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
              {boot.about?.heading}
            </h2>
            {boot.about?.paragraphs?.slice(0, 2).map((p) => (
              <p key={p} className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            <YearsOfExperience customersServed={boot.about?.customersServed ?? 500} />
            <Link
              to="/about-us"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Read more <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What we do</p>
            <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Our Services</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              End-to-end support for registering, licensing and growing your business.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 70}>
                <Link
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="surface-card group flex h-full flex-col p-6 transition-transform hover:-translate-y-1"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon name={s.icon || "briefcase"} size={22} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
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
        </div>
      </section>

      {articles.length ? (
        <section className="container-page py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Insights</p>
              <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">From the blog</h2>
            </div>
            <Link to="/blog" className="text-sm font-semibold text-primary link-underline">
              View all articles
            </Link>
          </Reveal>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((a, i) => (
              <Reveal as="li" key={a.slug} delay={i * 80}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: a.slug }}
                  className="surface-card block h-full p-6 transition-transform hover:-translate-y-1"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {a.published_at
                      ? new Date(a.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null}
                  </p>
                  <h3 className="mt-2 font-display text-base font-bold leading-snug">{a.title}</h3>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="bg-ink text-ink-foreground">
        <div className="container-page grid gap-6 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="font-display text-2xl font-black sm:text-3xl">
              Ready to register your company?
            </h2>
            <p className="mt-2 text-sm text-ink-foreground/75">
              Talk to a consultant today and get a clear plan, timeline and cost.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {["Free first consultation", "Transparent pricing", "Nationwide service"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/contacts"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Contact us <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
