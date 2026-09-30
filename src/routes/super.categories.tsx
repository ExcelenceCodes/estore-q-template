import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminListCategories, saveCategory, deleteCategory } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  Pagination,
  ImagePicker,
  useAction,
} from "@/components/admin/ui";
import { slugify } from "@/lib/admin-client";
import { mediaUrl } from "@/components/site/Icon";

export const Route = createFileRoute("/super/categories")({
  loader: () => adminListCategories({ data: { pageSize: 200 } }),
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const initial = Route.useLoaderData();
  const [page, setPage] = useState(initial.page);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_id: null as string | null,
    active: true,
    order_index: 0,
  });
  const { loading, execute } = useAction();

  const refresh = async () => {
    const data = await adminListCategories({ data: { pageSize: 200 } });
    setPage(data.page);
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", image_id: null, active: true, order_index: 0 });
    setShowForm(true);
  };

  const startEdit = (row: any) => {
    setEditing(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      image_id: row.image_id ?? null,
      active: row.active,
      order_index: row.order_index ?? 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const ok = await execute(
      "save",
      () =>
        saveCategory({
          data: {
            id: editing ?? undefined,
            name: form.name,
            slug: form.slug,
            description: form.description,
            image_id: form.image_id,
            active: form.active,
            order_index: form.order_index,
          },
        }),
      editing ? "Category updated" : "Category created",
    );
    if (ok) {
      setShowForm(false);
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await execute("delete", () => deleteCategory({ data: { id } }), "Category deleted");
    if (ok) refresh();
  };

  const onNameChange = (name: string) =>
    setForm({ ...form, name, slug: editing ? form.slug : slugify(name) });

  return (
    <>
      <PageHeading
        title="Categories"
        description="Manage product categories and subcategories."
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
        }
      />
      {showForm && (
        <Panel title={editing ? "Edit category" : "New category"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
                label="Category image"
                onChange={(image_id) => setForm({ ...form, image_id })}
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Slug</th>
                <th className="pb-2 font-semibold">Image</th>
                <th className="pb-2 font-semibold">Active</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3 text-muted-foreground">{row.slug}</td>
                  <td className="py-3">
                    {row.image_id ? (
                      <img src={mediaUrl(row.image_id)!} alt={row.name} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      "—"
                    )}
                  </td>
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
                {initial.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No categories yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={initial.totalPages} onPageChange={setPage} />
      </Panel>
    </>
  );
}
