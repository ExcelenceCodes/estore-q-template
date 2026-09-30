import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { site, pageTitle } from "@/lib/site";
import { listTeam } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { imageOf } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/about-us")({
  loader: () => listTeam(),
  head: () => {
    const title = pageTitle("About Us");
    const description = `Who we are, how we work and the team behind ${site.brand.legalName}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/about-us" },
      ],
      links: [{ rel: "canonical", href: "/about-us" }],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const boot = rootApi.useLoaderData();
  const team = Route.useLoaderData();

  return (
    <>
      <PageBanner title="About Us" crumb="About Us" image={boot.about?.image} />

      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Reveal>
            <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl">
              {boot.about?.heading}
            </h1>
            {boot.about?.paragraphs?.map((p) => (
              <p key={p} className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={120}>
            <div className="card border-l-2 border-l-primary p-7">
              <p className="font-display text-lg font-bold leading-snug">{boot.about?.highlight}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Serving clients since {site.brand.foundedYear}.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {site.features.team && team.length ? (
        <section className="bg-secondary py-16">
          <div className="container-page">
            <Reveal className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Our people
              </p>
              <h2 className="mt-3 font-display text-3xl font-black">Meet the team</h2>
            </Reveal>

            <ul className="scroll-x-rail mt-9 flex gap-5 overflow-x-auto pb-4">
              {team.map((m, i) => (
                <Reveal as="li" key={m.id} delay={i * 70} className="w-[260px] shrink-0">
                  <div className="surface-card h-full overflow-hidden">
                    <img
                      src={imageOf(m.photo_id, m.photo_url) ?? site.brand.logo}
                      alt={`${m.name}, ${m.role}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <div className="p-5">
                      <h3 className="font-display text-base font-bold">{m.name}</h3>
                      <p className="mt-1 text-sm text-primary">{m.role}</p>
                      {m.bio ? (
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          {m.bio}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Scroll sideways to meet everyone.</p>
          </div>
        </section>
      ) : null}
    </>
  );
}
