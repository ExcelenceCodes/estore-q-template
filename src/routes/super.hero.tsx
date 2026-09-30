import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { getSetting, saveSetting } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  ImagePicker,
  useAction,
} from "@/components/admin/ui";
import type { HeroSettings, HeroSlide } from "@/lib/public.functions";
import { mediaUrl } from "@/components/site/Icon";

const fallback: HeroSettings = {
  mode: "slideshow",
  autoplayMs: 6000,
  animateText: true,
  overlay: 0.55,
  solidToken: "primary",
  slides: [],
};

export const Route = createFileRoute("/super/hero")({
  loader: async () => ((await getSetting({ data: { key: "hero" } })) as HeroSettings) ?? fallback,
  component: HeroAdmin,
});

function HeroAdmin() {
  const loaded = Route.useLoaderData();
  const [hero, setHero] = useState<HeroSettings>({ ...fallback, ...(loaded ?? {}) });
  const { loading, execute } = useAction();

  const patchSlide = (index: number, patch: Partial<HeroSlide>) =>
    setHero({
      ...hero,
      slides: hero.slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    });

  return (
    <>
      <PageHeading
        title="Hero section"
        description="The big banner at the top of the home page."
        action={
          <button
            onClick={() =>
              void execute(
                "save",
                () => saveSetting({ data: { key: "hero", value: hero } }),
                "Hero saved",
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={loading === "save"}
          >
            {loading === "save" ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Save changes
              </>
            )}
          </button>
        }
      />

      <div className="space-y-6">
        <Panel title="Style">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Background">
              <select
                className={inputClass}
                value={hero.mode}
                onChange={(e) => setHero({ ...hero, mode: e.target.value as HeroSettings["mode"] })}
              >
                <option value="slideshow">Image slideshow</option>
                <option value="solid">Solid colour</option>
              </select>
            </Field>
            <Field label="Solid colour token" hint="Used when the background is solid.">
              <select
                className={inputClass}
                value={hero.solidToken}
                onChange={(e) => setHero({ ...hero, solidToken: e.target.value })}
              >
                {["primary", "secondary", "accent", "ink", "muted"].map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slide interval (ms)">
              <input
                type="number"
                className={inputClass}
                value={hero.autoplayMs}
                onChange={(e) => setHero({ ...hero, autoplayMs: Number(e.target.value) })}
              />
            </Field>
            <Field label="Overlay darkness" hint="0 to 1.">
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                className={inputClass}
                value={hero.overlay}
                onChange={(e) => setHero({ ...hero, overlay: Number(e.target.value) })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={hero.animateText}
                onChange={(e) => setHero({ ...hero, animateText: e.target.checked })}
              />
              Animate the headline text
            </label>
          </div>
        </Panel>

        <Panel
          title="Slides"
          description="Each slide has its own picture, headline and button."
          action={
            <button
              onClick={() =>
                setHero({
                  ...hero,
                  slides: [
                    ...hero.slides,
                    { url: "", title: "", subtitle: "", ctaLabel: "", ctaHref: "" },
                  ],
                })
              }
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Add slide
            </button>
          }
        >
          <div className="space-y-5">
            {hero.slides.map((slide, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <ImagePicker
                    imageUrl={slide.url}
                    label={`Slide ${index + 1} picture`}
                    onChange={(id) => patchSlide(index, { url: id ? (mediaUrl(id) ?? "") : "" })}
                  />
                  <Field label="Picture link" hint="Or paste an online image address.">
                    <input
                      className={inputClass}
                      value={slide.url}
                      onChange={(e) => patchSlide(index, { url: e.target.value })}
                    />
                  </Field>
                  <Field label="Headline">
                    <input
                      className={inputClass}
                      value={slide.title}
                      onChange={(e) => patchSlide(index, { title: e.target.value })}
                    />
                  </Field>
                  <Field label="Subtitle">
                    <input
                      className={inputClass}
                      value={slide.subtitle}
                      onChange={(e) => patchSlide(index, { subtitle: e.target.value })}
                    />
                  </Field>
                  <Field label="Button label">
                    <input
                      className={inputClass}
                      value={slide.ctaLabel ?? ""}
                      onChange={(e) => patchSlide(index, { ctaLabel: e.target.value })}
                    />
                  </Field>
                  <Field label="Button link">
                    <input
                      className={inputClass}
                      value={slide.ctaHref ?? ""}
                      onChange={(e) => patchSlide(index, { ctaHref: e.target.value })}
                    />
                  </Field>
                </div>
                <button
                  onClick={() =>
                    setHero({ ...hero, slides: hero.slides.filter((_, i) => i !== index) })
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remove slide
                </button>
              </div>
            ))}
            {hero.slides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slides yet.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
