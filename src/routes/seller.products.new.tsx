import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  saveProduct,
  adminListCategories,
  adminListBrands,
  adminListSpecDefinitions,
  saveProductImages,
  saveProductSpecs,
} from "@/lib/admin.functions";
import { PageHeading, Panel, Field, inputClass, useAction } from "@/components/admin/ui";
import { slugify } from "@/lib/admin-client";

export const Route = createFileRoute("/seller/products/new")({
  loader: async () => {
    const [cats, brands, specs] = await Promise.all([
      adminListCategories({ data: { pageSize: 200 } }),
      adminListBrands({ data: { pageSize: 100 } }),
      adminListSpecDefinitions(),
    ]);
    return { cats: cats.rows, brands: brands.rows, specs };
  },
  component: SellerNewProduct,
});

function SellerNewProduct() {
  const initial = Route.useLoaderData();
  const { loading, execute } = useAction();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    compare_at_price: "",
    sku: "",
    brand_id: "",
    category_id: "",
    status: "draft" as "draft" | "published" | "archived",
    featured: false,
    images: [] as any[],
    specs: [] as any[],
  });

  const onTitleChange = (title: string) => setForm({ ...form, title, slug: slugify(title) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await execute(
      "create",
      () =>
        saveProduct({
          data: {
            ...form,
            price: Number(form.price),
            compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
            sku: form.sku || null,
            brand_id: form.brand_id || null,
            status: form.status,
            featured: form.featured,
          },
        }),
      "Product created",
    );
    if (ok) {
      window.location.href = "/seller/products";
    }
  };

  return (
    <div>
      <PageHeading title="Post New Product" description="List a new product for sale." />
      <form onSubmit={handleSubmit}>
        <Panel title="Basic information">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
                required
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </Field>
            <Field label="Price (TZS)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </Field>
            <Field label="Compare at price (TZS)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.compare_at_price}
                onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
              />
            </Field>
            <Field label="SKU">
              <input
                className={inputClass}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label="Brand">
              <select
                className={inputClass}
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
              >
                <option value="">Select brand</option>
                {initial.brands.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {initial.cats.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Featured">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </Panel>
        <div className="mt-4">
          <button
            type="submit"
            disabled={loading === "create"}
            className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          >
            {loading === "create" ? "Publishing..." : "Publish Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
