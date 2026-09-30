import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { getSetting, saveSetting } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, useAction } from "@/components/admin/ui";
import type { AboutSettings } from "@/lib/public.functions";

const fallback: AboutSettings = {
  heading: "About Us",
  paragraphs: [],
  highlight: "",
  image: "",
  customersServed: 500,
};

export const Route = createFileRoute("/super/about")({
  loader: async () => ((await getSetting({ data: { key: "about" } })) as AboutSettings) ?? fallback,
  component: AboutAdmin,
});

function AboutAdmin() {
  const loaded = Route.useLoaderData();
  const [about, setAbout] = useState<AboutSettings>({ ...fallback, ...(loaded ?? {}) });
  const { loading, execute } = useAction();

  return (
    <>
      <PageHeading
        title="About Us"
        description="Manage the About Us section on the home page."
        action={
          <button
            onClick={() =>
              void execute(
                "save",
                () => saveSetting({ data: { key: "about", value: about } }),
                "About section saved",
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={loading === "save"}
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        }
      />

      <div className="space-y-6">
        <Panel title="General">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Heading">
              <input
                className={inputClass}
                value={about.heading}
                onChange={(e) => setAbout({ ...about, heading: e.target.value })}
              />
            </Field>
            <Field label="Highlight">
              <input
                className={inputClass}
                value={about.highlight}
                onChange={(e) => setAbout({ ...about, highlight: e.target.value })}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Paragraphs">
          <div className="space-y-4">
            {about.paragraphs.map((p, i) => (
              <Field key={i} label={`Paragraph ${i + 1}`}>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={p}
                  onChange={(e) => {
                    const next = [...about.paragraphs];
                    next[i] = e.target.value;
                    setAbout({ ...about, paragraphs: next });
                  }}
                />
              </Field>
            ))}
            <button
              onClick={() => setAbout({ ...about, paragraphs: [...about.paragraphs, ""] })}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Add paragraph
            </button>
          </div>
        </Panel>

        <Panel title="Media">
          <Field label="Image URL">
            <input
              className={inputClass}
              value={about.image}
              onChange={(e) => setAbout({ ...about, image: e.target.value })}
            />
          </Field>
        </Panel>

        <Panel title="Stats">
          <Field label="Customers served" hint="The number shown on the Customers Served card.">
            <input
              type="number"
              className={inputClass}
              value={about.customersServed}
              onChange={(e) => setAbout({ ...about, customersServed: Number(e.target.value) })}
            />
          </Field>
        </Panel>
      </div>
    </>
  );
}
