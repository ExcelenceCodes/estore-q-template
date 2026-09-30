import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { site } from "@/lib/site";
import { Icon, SocialIcon, socialIcons } from "./Icon";
import type { Bootstrap } from "@/lib/public.functions";

export function SiteHeader({ data, isNavigating }: { data: Bootstrap; isNavigating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [topHeight, setTopHeight] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  // Measure top portion height (socials + brand bar) on mount and resize
  const measureTop = useCallback(() => {
    if (topRef.current) {
      setTopHeight(topRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    measureTop();
    window.addEventListener("resize", measureTop);
    return () => window.removeEventListener("resize", measureTop);
  }, [measureTop]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hide top portion when scrolling down, show when scrolling up
      if (y < 80) {
        setHidden(false);
      } else if (y > lastY + 4) {
        setHidden(true);
      } else if (y < lastY - 4) {
        setHidden(false);
      }
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = site.navigation.primary.filter((item) => {
    if (item.requires === "articles") return site.features.blog && data.hasArticles;
    if (item.requires === "photos") return site.features.gallery && data.hasPhotos;
    return true;
  });

  const phone = data.contacts?.phones?.[0];
  const email = data.contacts?.emails?.[0];

  return (
    <header
      className="sticky top-0 z-50 transition-transform duration-300 ease-out"
      style={{ transform: hidden && !open ? `translateY(-${topHeight}px)` : "translateY(0)" }}
    >
      {isNavigating ? <div className="route-progress-stripe" aria-hidden="true" /> : null}

      {/* top portion: socials + brand bar (slides away on scroll down) */}
      <div ref={topRef}>
        {/* thin ink stripe with socials */}
        <div className="lg:bg-white">
          <div className="bg-ink text-ink-foreground lg:w-[70%] lg:ml-auto lg:top-strip-trapezoid">
            <div className="container-page flex h-9 items-center justify-between gap-4 text-xs lg:max-w-none lg:justify-end">
              <p className="truncate opacity-80 lg:hidden">{site.brand.motto}</p>
              <div className="flex shrink-0 items-center gap-3">
                {data.socials
                  .filter((s) => s.url)
                  .map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="opacity-80 transition-opacity hover:opacity-100"
                    >
                      <SocialIcon platform={s.platform} size={14} />
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* brand bar */}
        <div className={`bg-background transition-shadow ${scrolled ? "shadow-sm" : ""}`}>
          <div className="container-page grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <img
                src={site.brand.logo}
                alt={`${site.brand.legalName} logo`}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain lg:h-20 lg:w-20 lg:-mt-6 lg:-ml-12"
                decoding="async"
              />
              <span className="min-w-0 lg:-mt-6">
                <span className="block truncate font-brand text-lg font-extrabold uppercase tracking-tight sm:text-xl lg:text-[1.75rem]">
                  {site.brand.shortName || site.brand.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground lg:text-base">
                  {site.brand.tagline}
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-8 lg:flex">
              {phone ? (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-3">
                  <Phone className="shrink-0 text-primary" size={20} />
                  <span className="text-sm leading-tight">
                    <span className="block font-semibold">Call Us</span>
                    <span className="block text-primary">{phone}</span>
                  </span>
                </a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="flex items-center gap-3">
                  <Mail className="shrink-0 text-primary" size={20} />
                  <span className="text-sm leading-tight">
                    <span className="block font-semibold">Send us mail</span>
                    <span className="block text-primary">{email}</span>
                  </span>
                </a>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="justify-self-end rounded-md border border-border p-2 lg:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      {/* end top portion */}

      {/* nav bar – always visible; stays at top when top portion is hidden */}
      <nav className="hidden bg-primary text-primary-foreground lg:block">
        <div className="container-page">
          <ul className="ml-auto flex w-fit items-stretch">
            {nav.map((item) => (
              <li key={item.to} className="group relative">
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "bg-background text-foreground" }}
                  className="flex items-center gap-1 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-wide transition-colors hover:bg-background hover:text-foreground"
                >
                  {item.label}
                  {item.dynamic === "services" && data.services.length ? (
                    <ChevronDown size={14} />
                  ) : null}
                </Link>
                {item.dynamic === "services" && data.services.length ? (
                  <ul className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 bg-primary opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {data.services.map((s) => (
                      <li key={s.slug}>
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="block px-5 py-3 text-[13px] font-medium transition-colors hover:bg-background hover:text-foreground"
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* mobile drawer */}
      {open ? (
        <div className="border-t border-border bg-background lg:hidden">
          <ul className="container-page py-2">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-primary" }}
                  className="block border-b border-border py-3 text-sm font-semibold uppercase tracking-wide"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-page pb-4 text-sm">
            {phone ? <p className="text-primary">{phone}</p> : null}
            {email ? <p className="text-primary">{email}</p> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
