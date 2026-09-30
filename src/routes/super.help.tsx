import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock, HeartHandshake } from "lucide-react";
import { PageHeading, Panel } from "@/components/admin/ui";
import { getSetting } from "@/lib/admin.functions";
import type { ContactSettings } from "@/lib/public.functions";

const fallback: ContactSettings = {
  companyName: "",
  addressLines: [],
  phones: [],
  emails: [],
  hours: [],
  map: { enabled: true, query: "", zoom: 15 },
};

export const Route = createFileRoute("/super/help")({
  loader: async () =>
    ((await getSetting({ data: { key: "contacts" } })) as ContactSettings) ?? fallback,
  component: HelpPage,
});

function HelpPage() {
  const contacts = Route.useLoaderData() as ContactSettings;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Need Help?"
        description="We're always here for you. Reach out anytime — no question is too small."
      />

      <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-8">
        <div className="flex items-center gap-3 text-primary">
          <HeartHandshake className="h-8 w-8" />
          <h2 className="font-display text-xl font-bold">You're never alone</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Whether it's a quick question, a technical hiccup, or you just need someone to talk
          through an idea — we've got your back. Our team is standing by and we treat every message
          like it came from a friend.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick any channel below and we'll respond with the same care we'd give someone right next
          to us.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {contacts.phones.length ? (
          <Panel title="Call us" description="We love a good phone chat.">
            <ul className="space-y-2">
              {contacts.phones.map((phone, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {contacts.emails.length ? (
          <Panel title="Email us" description="We read every message personally.">
            <ul className="space-y-2">
              {contacts.emails.map((email, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`mailto:${email}`} className="text-sm font-semibold hover:underline">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {contacts.addressLines.length ? (
          <Panel title="Visit us" description="Coffee's on us if you stop by.">
            <ul className="space-y-2">
              {contacts.addressLines.map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span className="text-sm">{line}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {contacts.hours.length ? (
          <Panel title="When we're around" description="We keep friendly hours.">
            <ul className="space-y-2">
              {contacts.hours.map((slot, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">{slot.label}:</span> {slot.value}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>

      {contacts.map.enabled && contacts.map.query ? (
        <div className="mt-6">
          <Panel title="Find us on the map" description="We're easier to spot than we think.">
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/40">
              <iframe
                title="Location map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(contacts.map.query)}&z=${contacts.map.zoom}&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
