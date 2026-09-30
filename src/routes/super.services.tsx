import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Save, X } from "lucide-react";
import { adminListServices, saveService, deleteService } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  ImagePicker,
  useAction,
} from "@/components/admin/ui";
import { slugify } from "@/lib/admin-client";
import { Icon } from "@/components/site/Icon";

export const Route = createFileRoute("/super/services")({
  loader: () => adminListServices(),
  component: ServicesAdmin,
});

type Draft = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  icon: string;
  image_id: string | null;
  highlights: string[];
  order_index: number;
  published: boolean;
};

const empty: Draft = {
  slug: "",
  title: "",
  summary: "",
  body: "",
  icon: "briefcase",
  image_id: null,
  highlights: [],
  order_index: 0,
  published: true,
};

function ServicesAdmin() {
  const { rows } = Route.useLoaderData() as {
    rows: Draft[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const { loading, execute } = useAction();

  async function save() {
    if (!draft) return;
    const payload = { ...draft, slug: draft.slug || slugify(draft.title) };
    const ok = await execute("save", () => saveService({ data: payload }), "Service saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this service permanently?")) return;
    await execute(`delete-${id}`, () => deleteService({ data: { id } }), "Service deleted");
    await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Services"
        description="Everything shown on the services pages."
        action={
          <button
            onClick={() => setDraft({ ...empty, order_index: rows.length })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New service
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit service" : "New service"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={() => void execute("save", save, "Service saved")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                  disabled={loading === "save"}
                >
                  {loading === "save" ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                  )}
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      title: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Web address" hint="Used in the page link.">
                <input
                  className={inputClass}
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                />
              </Field>
              <Field label="Icon name" hint="Any lucide icon name, e.g. building-2, file-text.">
                <input
                  className={inputClass}
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                />
              </Field>
              <Field label="Order">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.order_index}
                  onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) })}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Short summary">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={draft.summary}
                    onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Full description">
                  <textarea
                    rows={6}
                    className={inputClass}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Highlights" hint="One per line.">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={draft.highlights.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        highlights: e.target.value
                          .split("\n")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              </div>
              <ImagePicker
                mediaId={draft.image_id}
                onChange={(id) => setDraft({ ...draft, image_id: id })}
              />
              <label className="flex items-center gap-2 self-end text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />
                Visible on the website
              </label>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon name={row.icon} className="h-5 w-5" />
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  row.published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {row.published ? "Live" : "Hidden"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold">{row.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.summary}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: row.id,
                    slug: row.slug,
                    title: row.title,
                    summary: row.summary ?? "",
                    body: row.body ?? "",
                    icon: row.icon ?? "briefcase",
                    image_id: row.image_id,
                    highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
                    order_index: row.order_index ?? 0,
                    published: row.published,
                  })
                }
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                onClick={() => execute(`delete-${row.id}`, () => remove(row.id), "Service deleted")}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                disabled={loading === `delete-${row.id}`}
              >
                {loading === `delete-${row.id}` ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
