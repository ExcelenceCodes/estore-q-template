import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Save, Trash2, Search, GripVertical } from "lucide-react";
import {
  adminListProducts,
  saveProduct,
  deleteProduct,
  adminListBrands,
  adminListCategories,
  saveProductImages,
  saveProductCategories,
} from "@/lib/admin.functions";
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
import { imageOf, mediaUrl } from "@/components/site/Icon";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  sku?: string | null;
  price: number;
  status: string;
  featured: boolean;
  image_url?: string | null;
  brand_id?: string | null;
};

type ImageDraft = {
  id?: string;
  media_id: string | null;
  image_url: string | null;
  alt_text: string;
  order_index: number;
};

const emptyImage: ImageDraft = {
  media_id: null,
  image_url: null,
  alt_text: "",
  order_index: 1,
};

type CategoryOption = { id: string; name: string; slug: string };

export const Route = createFileRoute("/super/products")({
  loader: async () => {
    const [products, brands, categories] = await Promise.all([
      adminListProducts({ data: { pageSize: 50 } }),
      adminListBrands({ data: { pageSize: 100 } }),
      adminListCategories({ data: { pageSize: 200 } }),
    ]);
    return { ...products, brands: brands.rows, categories: categories.rows };
  },
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const initial = Route.useLoaderData() as ProductRow & {
    brands: CategoryOption[];
    categories: CategoryOption[];
  };
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(initial.page);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [brands] = useState<CategoryOption[]>(initial.brands ?? []);
  const [allCategories] = useState<CategoryOption[]>(initial.categories ?? []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    sku: "",
    description: "",
    price: "",
    brand_id: "",
    image_url: null as string | null,
    status: "draft" as "draft" | "published" | "archived",
    featured: false,
  });
  const { loading, execute } = useAction();

  const refresh = async (p = page, query = q) => {
    const data = await adminListProducts({
      data: { page: p, pageSize: 50, q: query || undefined },
    });
    setPage(data.page);
    router.invalidate();
  };

  const startCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      sku: "",
      description: "",
      price: "",
      brand_id: "",
      image_url: null,
      status: "draft",
      featured: false,
    });
    setSelectedCategoryIds([]);
    setImages([]);
    setShowForm(true);
  };

  const startEdit = (row: ProductRow) => {
    setEditing(row.id);
    setForm({
      title: row.title,
      slug: row.slug,
      sku: row.sku ?? "",
      description: row.description ?? "",
      price: String(row.price ?? ""),
      brand_id: row.brand_id ?? "",
      image_url: row.image_url ?? null,
      status: row.status as ProductFormData["status"],
      featured: row.featured,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const ok = await execute(
      "save",
      () =>
        saveProduct({
          data: {
            id: editing ?? undefined,
            title: form.title,
            slug: form.slug,
            sku: form.sku || null,
            description: form.description,
            price: Number(form.price),
            brand_id: form.brand_id || null,
            image_url: form.image_url,
            status: form.status,
            featured: form.featured,
          },
        }),
      editing ? "Product updated" : "Product created",
    );
    if (ok) {
      setShowForm(false);
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await execute("delete", () => deleteProduct({ data: { id } }), "Product deleted");
    if (ok) refresh();
  };

  const onTitleChange = (title: string) => {
    setForm({ ...form, title, slug: editing ? form.slug : slugify(title) });
  };

  const addImage = () => {
    setImages((prev) => [
      ...prev,
      {
        ...emptyImage,
        order_index: prev.length > 0 ? Math.max(...prev.map((i) => i.order_index)) + 1 : 1,
      },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, patch: Partial<ImageDraft>) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  const handleSaveImages = async (productId: string) => {
    const payload = images.map((img, idx) => ({
      ...img,
      order_index: idx + 1,
    }));
    await execute(
      "images",
      () => saveProductImages({ data: { productId, images: payload } }),
      "Images saved",
    );
  };

  const handleSaveCategories = async (productId: string) => {
    await execute(
      "categories",
      () => saveProductCategories({ data: { productId, categoryIds: selectedCategoryIds } }),
      "Categories saved",
    );
  };

  return (
    <>
      <PageHeading
        title="Products"
        description="Manage your product catalog."
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search by title, slug or SKU..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && refresh(1, e.currentTarget.value)}
            />
          </div>
          <button
            onClick={() => refresh(1, q)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Search
          </button>
        </div>
      </Panel>

      {showForm && (
        <Panel
          title={editing ? "Edit product" : "New product"}
          description="Fill in the product details below."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="SKU">
              <input
                className={inputClass}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Brand">
              <select
                className={inputClass}
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProductFormData["status"] })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
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
              <ImagePicker
                imageUrl={form.image_url}
                label="Primary product picture"
                onChange={(id) => setForm({ ...form, image_url: id ? (mediaUrl(id) ?? "") : null })}
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Categories">
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={(e) =>
                          setSelectedCategoryIds((prev) =>
                            e.target.checked
                              ? [...prev, cat.id]
                              : prev.filter((id) => id !== cat.id),
                          )
                        }
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
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
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading === "save"}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" /> {loading === "save" ? "Saving..." : "Save"}
            </button>
            {editing && (
              <>
                <button
                  onClick={() => handleSaveImages(editing)}
                  disabled={loading === "images"}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium"
                >
                  {loading === "images" ? "Saving images..." : "Save images"}
                </button>
                <button
                  onClick={() => handleSaveCategories(editing)}
                  disabled={loading === "categories"}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium"
                >
                  {loading === "categories" ? "Saving categories..." : "Save categories"}
                </button>
              </>
            )}
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {editing && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Product images (up to 5)
                </span>
                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" /> Add image
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2">
                      <ImagePicker
                        mediaId={img.media_id}
                        imageUrl={img.image_url}
                        onChange={(media_id) => updateImage(idx, { media_id })}
                      />
                    </div>
                    <Field label="Alt text" className="mt-2">
                      <input
                        className={inputClass}
                        value={img.alt_text}
                        onChange={(e) => updateImage(idx, { alt_text: e.target.value })}
                      />
                    </Field>
                  </div>
                ))}
                {images.length === 0 && (
                  <p className="text-xs text-muted-foreground">No additional images added yet.</p>
                )}
              </div>
            </div>
          )}
        </Panel>
      )}

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 font-semibold">Title</th>
                <th className="pb-2 font-semibold">Slug</th>
                <th className="pb-2 font-semibold">SKU</th>
                <th className="pb-2 font-semibold">Price</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Featured</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.rows.map((row: ProductRow) => (
                <tr key={row.id}>
                  <td className="py-3 font-medium">{row.title}</td>
                  <td className="py-3 text-muted-foreground">{row.slug}</td>
                  <td className="py-3 text-muted-foreground">{row.sku || "—"}</td>
                  <td className="py-3">TZS {Number(row.price).toLocaleString()}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.status === "published"
                          ? "bg-primary/10 text-primary"
                          : row.status === "draft"
                            ? "bg-muted text-muted-foreground"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3">{row.featured ? "Yes" : "No"}</td>
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
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No products yet.
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
