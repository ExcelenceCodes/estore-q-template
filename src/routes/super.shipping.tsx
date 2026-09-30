import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  adminListShippingMethods,
  saveShippingMethod,
  deleteShippingMethod,
} from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, useAction } from "@/components/admin/ui";

type ShippingRow = { id: string; name: string; description?: string | null; price: number; free_threshold?: number | null; active: boolean; order_index: number; estimated_days: number };
type ShippingFormData = { name: string; description: string; price: string; free_threshold: string; active: boolean; order_index: number; estimated_days: string };

export const Route = createFileRoute("/super/shipping")({
  loader: () => adminListShippingMethods(),
  component: ShippingAdmin,
});

function ShippingAdmin() {
  const initial = Route.useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    free_threshold: "",
    active: true,
    order_index: 0,
    estimated_days: "3",
  });
  const { loading, execute } = useAction();

  const startCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      free_threshold: "",
      active: true,
      order_index: 0,
      estimated_days: "3",
    });
    setShowForm(true);
  };
  const startEdit = (row: ShippingRow) => {
    setEditing(row.id);
    setForm({
      name: row.name,
      description: row.description ?? "",
      price: String(row.price ?? ""),
      free_threshold: row.free_threshold != null ? String(row.free_threshold) : "",
      active: row.active,
      order_index: row.order_index ?? 0,
      estimated_days: String(row.estimated_days ?? "3"),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const ok = await execute(
      "save",
      () =>
        saveShippingMethod({
          data: {
            id: editing ?? undefined,
            name: form.name,
            description: form.description || null,
            price: Number(form.price),
            free_threshold: form.free_threshold ? Number(form.free_threshold) : null,
            active: form.active,
            order_index: form.order_index,
            estimated_days: Number(form.estimated_days),
          },
        }),
      editing ? "Shipping method updated" : "Shipping method created",
    );
    if (ok) {
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await execute(
      "delete",
      () => deleteShippingMethod({ data: { id } }),
      "Shipping method deleted",
    );
  };

  return (
    <>
      <PageHeading
        title="Shipping Methods"
        description="Manage shipping options and rates."
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add method
          </button>
        }
      />
      {showForm && (
        <Panel title={editing ? "Edit shipping method" : "New shipping method"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Price (TZS)">
              <input
                type="number"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Free threshold (TZS)">
              <input
                type="number"
                className={inputClass}
                value={form.free_threshold}
                onChange={(e) => setForm({ ...form, free_threshold: e.target.value })}
              />
            </Field>
            <Field label="Estimated days">
              <input
                type="number"
                className={inputClass}
                value={form.estimated_days}
                onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
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
              <Field label="Description">
                <textarea
                  className={inputClass}
                  rows={2}
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
                <th className="pb-2 font-semibold">Price</th>
                <th className="pb-2 font-semibold">Free threshold</th>
                <th className="pb-2 font-semibold">Days</th>
                <th className="pb-2 font-semibold">Active</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.map((row: ShippingRow) => (
                <tr key={row.id}>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3">TZS {Number(row.price).toLocaleString()}</td>
                  <td className="py-3 text-muted-foreground">
                    {row.free_threshold != null
                      ? `TZS ${Number(row.free_threshold).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="py-3">{row.estimated_days}</td>
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
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No shipping methods yet.
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
