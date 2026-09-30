import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminListPromotions, savePromotion, deletePromotion } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, ImagePicker, useAction } from "@/components/admin/ui";
import { mediaUrl } from "@/components/site/Icon";

type PromotionRow = { id: string; title: string; subtitle?: string | null; link_label?: string | null; image_id?: string | null; active: boolean };
type PromotionFormData = { title: string; subtitle: string; link_url: string; link_label: string; image_id: string | null; active: boolean; order_index: number; starts_at: string; ends_at: string };

export const Route = createFileRoute("/super/promotions")({
  loader: () => adminListPromotions(),
  component: PromotionsAdmin,
});

function PromotionsAdmin() {
  const initial = Route.useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    link_url: "",
    link_label: "Shop Now",
    image_id: null as string | null,
    active: true,
    order_index: 0,
    starts_at: "",
    ends_at: "",
  });
  const { loading, execute } = useAction();

  const startCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      link_url: "",
      link_label: "Shop Now",
      image_id: null,
      active: true,
      order_index: 0,
      starts_at: "",
      ends_at: "",
    });
    setShowForm(true);
  };
  const startEdit = (row: PromotionRow) => {
    setEditing(row.id);
    setForm({
      title: row.title,
      subtitle: row.subtitle ?? "",
      link_url: row.link_url ?? "",
      link_label: row.link_label ?? "Shop Now",
      image_id: row.image_id ?? null,
      active: row.active,
      order_index: row.order_index ?? 0,
      starts_at: row.starts_at ?? "",
      ends_at: row.ends_at ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const ok = await execute(
      "save",
      () =>
        savePromotion({
          data: {
            id: editing ?? undefined,
            ...form,
            image_id: form.image_id,
            starts_at: form.starts_at || null,
            ends_at: form.ends_at || null,
          },
        }),
      editing ? "Promotion updated" : "Promotion created",
    );
    if (ok) {
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await execute(
      "delete",
      () => deletePromotion({ data: { id } }),
      "Promotion deleted",
    );
  };

  return (
    <>
      <PageHeading
        title="Promotions"
        description="Manage homepage promotions and banners."
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add promotion
          </button>
        }
      />
      {showForm && (
        <Panel title={editing ? "Edit promotion" : "New promotion"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Link label">
              <input
                className={inputClass}
                value={form.link_label}
                onChange={(e) => setForm({ ...form, link_label: e.target.value })}
              />
            </Field>
            <Field label="Link URL">
              <input
                className={inputClass}
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
            </Field>
            <Field label="Order index">
              <input
                type="number"
                className={inputClass}
                value={String(form.order_index)}
                onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
              />
            </Field>
            <Field label="Starts at">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </Field>
            <Field label="Ends at">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </Field>
            <Field label="Active">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </Field>
            <div className="md:col-span-2">
              <ImagePicker
                mediaId={form.image_id}
                label="Promotion image"
                onChange={(image_id) => setForm({ ...form, image_id })}
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Subtitle">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading === "save"}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" /> {loading === "save" ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </Panel>
      )}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 font-semibold">Title</th>
                <th className="pb-2 font-semibold">Image</th>
                <th className="pb-2 font-semibold">Link</th>
                <th className="pb-2 font-semibold">Active</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.map((row: PromotionRow) => (
                <tr key={row.id}>
                  <td className="py-3 font-medium">{row.title}</td>
                  <td className="py-3">
                    {row.image_id ? (
                      <img src={mediaUrl(row.image_id)!} alt={row.title} className="h-8 w-16 rounded object-cover" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">{row.link_label || "—"}</td>
                  <td className="py-3">{row.active ? "Yes" : "No"}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(row)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-md border border-destructive/40 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
                {initial.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No promotions yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
