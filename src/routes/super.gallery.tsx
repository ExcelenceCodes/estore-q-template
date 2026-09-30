import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Save, X, ZoomIn } from "lucide-react";
import { adminListGallery, savePhoto, deletePhoto } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  ImagePicker,
  useAction,
} from "@/components/admin/ui";
import { imageOf, mediaUrl } from "@/components/site/Icon";

export const Route = createFileRoute("/super/gallery")({
  loader: () => adminListGallery(),
  component: GalleryAdmin,
});

type Draft = {
  id?: string;
  media_id: string | null;
  image_url: string | null;
  caption: string;
  category: string;
  width: number | null;
  height: number | null;
  posted_on: string;
};

const empty: Draft = {
  media_id: null,
  image_url: null,
  caption: "",
  category: "General",
  width: null,
  height: null,
  posted_on: new Date().toISOString().slice(0, 10),
};

function GalleryAdmin() {
  const data = Route.useLoaderData() as {
    rows: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  const rows = data.rows;
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { loading, execute } = useAction();

  const categories = useMemo(() => {
    const set = new Set(rows.map((r: any) => r.category).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let data = rows;
    if (categoryFilter !== "all") data = data.filter((r: any) => r.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (r: any) =>
          (r.caption ?? "").toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q),
      );
    }
    return data;
  }, [rows, categoryFilter, search]);

  async function save() {
    if (!draft) return;
    await savePhoto({ data: draft });
    setDraft(null);
    await router.invalidate();
  }

  function createNew() {
    setDraft({ ...empty, posted_on: new Date().toISOString().slice(0, 10) });
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo permanently?")) return;
    await deletePhoto({ data: { id } });
    await router.invalidate();
    if (draft?.id === id) setDraft(null);
  }

  function startEdit(row: any) {
    setDraft({
      id: row.id,
      media_id: row.media_id,
      image_url: row.image_url,
      caption: row.caption ?? "",
      category: row.category ?? "General",
      width: row.width ?? null,
      height: row.height ?? null,
      posted_on: row.posted_on ? String(row.posted_on).slice(0, 10) : empty.posted_on,
    });
  }

  return (
    <>
      <PageHeading
        title="Gallery"
        description="Manage photos shown in the website gallery."
        action={
          <button
            onClick={() => void createNew()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New photo
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit photo" : "New photo"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={() => void execute("save", save, "Photo saved")}
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
              <div className="md:col-span-2">
                <ImagePicker
                  mediaId={draft.media_id}
                  imageUrl={draft.image_url}
                  onChange={(id) =>
                    setDraft((prev) => ({
                      ...prev,
                      media_id: id,
                      image_url: id ? (mediaUrl(id) ?? prev.image_url) : null,
                    }))
                  }
                  onDimensions={(width, height) => setDraft((prev) => ({ ...prev, width, height }))}
                />
              </div>
              <Field label="Image URL" hint="Optional fallback URL if no media is selected.">
                <input
                  className={inputClass}
                  value={draft.image_url ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, image_url: e.target.value || null }))
                  }
                />
              </Field>
              <Field label="Category" hint="Used to group photos.">
                <input
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                />
              </Field>
              <Field label="Caption">
                <input
                  className={inputClass}
                  value={draft.caption}
                  onChange={(e) => setDraft((prev) => ({ ...prev, caption: e.target.value }))}
                />
              </Field>
              <Field label="Posted on">
                <input
                  type="date"
                  className={inputClass}
                  value={draft.posted_on}
                  onChange={(e) => setDraft((prev) => ({ ...prev, posted_on: e.target.value }))}
                />
              </Field>
              <Field label="Width (px)">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.width ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      width: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </Field>
              <Field label="Height (px)">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.height ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      height: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </Field>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            className={inputClass}
            placeholder="Search gallery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={inputClass}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} photo{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((row: any) => {
          const src = imageOf(row.media_id, row.image_url);
          return (
            <div
              key={row.id}
              className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
            >
              <div
                className="relative aspect-video w-full cursor-zoom-in bg-muted"
                onClick={() => src && setPreviewUrl(src)}
              >
                {src ? (
                  <img
                    src={src}
                    alt={row.caption || "Gallery photo"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                {src ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#131313]/0 transition-colors hover:bg-[#131313]/20">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100" />
                  </div>
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{row.caption || "Untitled photo"}</p>
                  <p className="text-xs text-muted-foreground">{row.category || "General"}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.width ?? "?"} x {row.height ?? "?"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(row)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void remove(row.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                    disabled={loading === `delete-${row.id}`}
                  >
                    {loading === `delete-${row.id}` ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No photos found.
          </div>
        ) : null}
      </div>

      {previewUrl && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#131313]/80 p-4"
              onClick={() => setPreviewUrl(null)}
            >
              <div className="relative max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[90vh] max-w-full rounded-lg object-contain"
                />
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="absolute -right-3 -top-3 rounded-full bg-white p-1 text-black shadow-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
