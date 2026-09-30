import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";
import { Icon, SocialIcon, socialIcons } from "./Icon";
import type { Bootstrap } from "@/lib/public.functions";

export function SiteFooter({ data }: { data: Bootstrap }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20">
      <div className="bg-secondary text-secondary-foreground">
        <div className="container-page grid gap-10 py-14 md:grid-cols-3">
          <div>
            <h2 className="font-display text-lg font-extrabold">Our Services</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {data.services.map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="flex items-start gap-2 transition-colors hover:text-primary"
                  >
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold">Quick Links</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.navigation.quickLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 transition-colors hover:text-primary"
                  >
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold">Get in Touch</h2>
            <address className="mt-4 space-y-1 text-sm not-italic">
              <p className="font-bold">{data.contacts?.companyName}</p>
              {data.contacts?.addressLines?.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {data.contacts?.phones?.map((p) => (
                <p key={p}>
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-primary">
                    {p}
                  </a>
                </p>
              ))}
              {data.contacts?.emails?.map((e) => (
                <p key={e}>
                  <a href={`mailto:${e}`} className="hover:text-primary">
                    {e}
                  </a>
                </p>
              ))}
            </address>

            {data.socials.length ? (
              <div className="mt-5 flex gap-2">
                {data.socials
                  .filter((s) => s.url)
                  .map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="grid h-9 w-9 place-items-center rounded-full transition-transform hover:-translate-y-0.5"
                    >
                      <SocialIcon platform={s.platform} size={16} />
                    </a>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-ink text-ink-foreground">
        <div className="container-page grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 text-xs">
          <p className="min-w-0 truncate">
            {site.copyright} &middot; Copyright &copy; {year}
          </p>
          {site.partner.enabled ? (
            <p className="shrink-0">
              {site.partner.prefix}{" "}
              <a
                href={site.partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-yellow-500 link-underline"
              >
                {site.partner.label}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
