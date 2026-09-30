import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { PageBanner } from "@/components/site/PageBanner";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/qsa/info")({
  head: () => ({
    meta: [
      { title: pageTitle("QSA Info") },
      {
        name: "description",
        content:
          "Complete feature overview of the Q Softwares Africa business platform — services, blog, gallery, team, contact, admin panel and more.",
      },
      { property: "og:title", content: pageTitle("QSA Info") },
      { property: "og:url", content: "/qsa/info" },
    ],
    links: [{ rel: "canonical", href: "/qsa/info" }],
  }),
  component: QsaInfoPage,
});

const features = [
  {
    icon: LayoutDashboard,
    title: "Hero & Branding",
    body: "Configurable hero section with slideshow or solid background, animated text, overlay control, and call-to-action buttons. Top info strip and sticky header with logo, tagline, phone, email, and social links.",
  },
  {
    icon: Globe,
    title: "Service Catalogue",
    body: "Dynamic services grid with icons, summaries, and detail pages. Each service can include rich content, highlights, and a direct request-quote flow. Fully manageable from the admin panel.",
  },
  {
    icon: Users,
    title: "About & Team",
    body: "Dedicated About Us page with company story, highlights, and a horizontal-scroll team section with photos, roles, and bios. Years-of-experience and customers-served counters with animated progress bars.",
  },
  {
    icon: Shield,
    title: "Blog & Insights",
    body: "Full blog system with article listing, search, pagination, and detail pages. Supports cover images, authors, dates, tags, excerpts, and rich body content. Recent posts sidebar included.",
  },
  {
    icon: Zap,
    title: "Gallery",
    body: "Photo gallery grouped by month with masonry-style layout, captions, and a fullscreen lightbox. Up to 85 photos managed from the admin panel.",
  },
  {
    icon: Mail,
    title: "Contact & Map",
    body: "Contact cards for address, phone, email, and working hours. Built-in enquiry form with client-side validation and server-side submission. Embedded Google Maps for office location.",
  },
  {
    icon: Settings,
    title: "Admin Panel",
    body: "Secure super-admin area to manage hero slides, services, blog articles, gallery photos, team members, contacts, about content, and social links. Dashboard with activity overview.",
  },
  {
    icon: Smartphone,
    title: "Responsive & Accessible",
    body: "Mobile-first design with hamburger navigation, adaptive layouts, and smooth scroll-reveal animations. Dark mode support, reduced-motion respect, and semantic HTML throughout.",
  },
];

const techStack = [
  "TanStack Router — file-based routing with data loaders",
  "TanStack Query — async state management and caching",
  "Tailwind CSS v4 — utility-first styling with design tokens",
  "shadcn/ui — accessible component primitives",
  "Vaul / Radix — drawer, dialog, and sheet overlays",
  "Lucide React — consistent icon system",
  "PostgreSQL — relational data via Supabase client",
  "Vite + Nitro — fast dev experience and SSR",
];

function QsaInfoPage() {
  return (
    <>
      <PageBanner title="QSA Info" crumb="QSA Info" />

      <section className="container-page py-16">
        <Reveal className="max-w-3xl">
          <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl">
            Q Softwares Africa — Business Platform
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A complete, production-ready web platform designed for consultancies, service bureaus,
            and corporate-facing businesses. Below is a detailed, brand-independent overview of
            every feature included so you can evaluate exactly what you are getting.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="surface-card h-full p-6">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon size={24} />
                </div>
                <h2 className="mt-5 font-display text-lg font-bold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-2xl font-black sm:text-3xl">Technology Stack</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Built on modern, proven technologies chosen for performance, maintainability, and
              long-term support.
            </p>
            <ul className="mt-6 space-y-3">
              {techStack.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="space-y-6">
            <div className="surface-card p-7">
              <h2 className="font-display text-lg font-bold">Licence</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This platform is delivered as a fully licensed web solution for Q Softwares Africa
                and its clients. The codebase, design system, and content structure are proprietary.
                Redistribution, resale, or reuse without explicit written permission from Q
                Softwares Africa is prohibited. Clients receive a deployment-ready instance with
                documentation and support.
              </p>
            </div>

            <div className="surface-card p-7">
              <h2 className="font-display text-lg font-bold">Support & Contact</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <Mail size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    Email:{" "}
                    <a href="mailto:info@qsoftwares.co.tz" className="font-semibold text-primary">
                      info@qsoftwares.co.tz
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    Phone / SMS / WhatsApp:{" "}
                    <a href="tel:+255703032017" className="font-semibold text-primary">
                      +255 703 032 017
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Globe size={17} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    Web:{" "}
                    <a
                      href="https://www.qsoftwares.co.tz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary"
                    >
                      www.qsoftwares.co.tz
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="mt-14">
          <Reveal>
            <div className="surface-card bg-ink text-ink-foreground p-8 sm:p-10">
              <h2 className="font-display text-2xl font-black sm:text-3xl">
                Ready to take your business online?
              </h2>
              <p className="mt-3 text-sm text-ink-foreground/80">
                Whether you need a company registration portal, a consultancy website, or a full
                client-facing platform — Q Softwares Africa delivers.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="mailto:info@qsoftwares.co.tz"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Get in touch <ArrowRight size={16} />
                </a>
                <a
                  href="https://www.qsoftwares.co.tz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-white/35 px-6 py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-white/10"
                >
                  Visit website
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
