import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { site, pageTitle } from "@/lib/site";
import { submitInquiry } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { Icon, SocialIcon, socialIcons } from "@/components/site/Icon";
import { PageBanner } from "@/components/site/PageBanner";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/contacts")({
  head: () => {
    const title = pageTitle("Contact Us");
    const description = `Talk to ${site.brand.legalName} — phone, email, office location and enquiry form.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "/contacts" },
      ],
      links: [{ rel: "canonical", href: "/contacts" }],
    };
  },
  component: ContactsPage,
});

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

function ContactsPage() {
  const boot = rootApi.useLoaderData();
  const contacts = boot.contacts;
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const mapQuery = contacts?.map?.query || site.seo.geo.street;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${contacts?.map?.zoom ?? 15}&output=embed`;

  const cards = [
    {
      icon: MapPin,
      title: "Visit our office",
      lines: contacts?.addressLines ?? [],
    },
    {
      icon: Phone,
      title: "Call us",
      lines: contacts?.phones ?? [],
    },
    {
      icon: Mail,
      title: "Email us",
      lines: contacts?.emails ?? [],
    },
    {
      icon: Clock,
      title: "Working hours",
      lines: (contacts?.hours ?? []).map((h) => `${h.label}: ${h.value}`),
    },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus({ kind: "sending" });
    try {
      const res = await submitInquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      if (res.ok) {
        form.reset();
        setStatus({ kind: "sent", message: "Thank you. We have received your message." });
      } else {
        setStatus({ kind: "error", message: res.error });
      }
    } catch {
      setStatus({
        kind: "error",
        message: "Please check your details and try again.",
      });
    }
  }

  return (
    <>
      <PageBanner title="Contact Us" crumb="Contact Us" />

      <section className="container-page py-14">
        <ul className="scroll-x-rail flex gap-4 overflow-x-auto pb-4">
          {cards.map((c, i) => (
            <Reveal as="li" key={c.title} delay={i * 70} className="w-[270px] shrink-0">
              <div className="surface-card h-full p-6">
                <c.icon className="text-primary" size={24} />
                <h2 className="mt-4 font-display text-base font-bold">{c.title}</h2>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {c.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Scroll sideways for more details.</p>
      </section>

      <section className="container-page grid gap-10 pb-16 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <h2 className="font-display text-2xl font-black sm:text-3xl">Send us a message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us what you need and we will reply with next steps.
          </p>

          <form onSubmit={onSubmit} className="mt-7 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Your name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="text-sm font-medium">
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <label className="text-sm font-medium">
              Subject
              <input
                name="subject"
                maxLength={150}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium">
              Message
              <textarea
                name="message"
                required
                minLength={5}
                maxLength={2000}
                rows={6}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status.kind === "sending"}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {status.kind === "sending" ? "Sending..." : "Send message"}
                <Send size={16} />
              </button>
              {status.message ? (
                <p
                  role="status"
                  className={`text-sm ${status.kind === "error" ? "text-destructive" : "text-primary"}`}
                >
                  {status.message}
                </p>
              ) : null}
            </div>
          </form>

          {boot.socials.filter((s) => s.url).length ? (
            <div className="mt-8 flex items-center gap-3">
              <span className="text-sm font-semibold">Follow us</span>
              {boot.socials
                .filter((s) => s.url)
                .map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <SocialIcon platform={s.platform} size={16} />
                  </a>
                ))}
            </div>
          ) : null}
        </Reveal>

        {site.features.map && contacts?.map?.enabled ? (
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title={`${site.brand.legalName} office location`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full lg:h-[560px]"
              />
            </div>
          </Reveal>
        ) : null}
      </section>
    </>
  );
}
