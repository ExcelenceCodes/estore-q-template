import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  ChevronDown,
  Package,
  Filter,
} from "lucide-react";
import { listProducts, listCategories, listBrands, listPromotions, getProductEngagement } from "@/lib/public.functions";
import { imageOf } from "@/components/site/Icon";
import { ProductCard } from "@/components/site/ProductCard";
import { CategoryCard } from "@/components/site/CategoryCard";
import { Reveal } from "@/components/site/Reveal";
import { site, pageTitle } from "@/lib/site";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/seo";

export const Route = createFileRoute("/shop/")({
  loader: async ({ search }) => {
    const [products, categories, brands, promotions] = await Promise.all([
      listProducts({
        data: {
          q: search.q as string | undefined,
          category: search.category as string | undefined,
          brand: search.brand as string | undefined,
          featured: search.featured === "true" ? true : undefined,
          page: Number(search.page) || 1,
          pageSize: Number(search.pageSize) || 20,
        },
      }),
      listCategories(),
      listBrands(),
      listPromotions(),
    ]);

    const engagementMap = new Map<string, { likes: number; views: number }>();
    for (const p of products.rows) {
      const eng = await getProductEngagement({ data: { productId: p.id } });
      engagementMap.set(p.id, eng);
    }

    return {
      products,
      categories,
      brands,
      promotions,
      engagementMap,
    };
  },
  head: () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      meta: [
        { title: pageTitle("Shop") },
        { name: "description", content: site.seo.defaultDescription },
        { name: "keywords", content: site.seo.keywords.join(", ") },
        { property: "og:title", content: pageTitle("Shop") },
        { property: "og:description", content: site.seo.defaultDescription },
        { property: "og:url", content: "/shop" },
        ...(site.seo.socials?.twitter ? [{ name: "twitter:site", content: site.seo.socials.twitter }] : []),
      ],
      links: [{ rel: "canonical", href: "/shop" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildBreadcrumbSchema("", [{ name: "Shop", path: "/shop" }])),
        },
      ],
    };
  },
  component: ShopPage,
});

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price?: string | null;
  image_url?: string | null;
  featured?: boolean;
  brand_id?: string | null;
};

type CategoryRow = { id: string; name: string; slug: string; description?: string | null; image_id?: string | null };
type BrandRow = { id: string; name: string; slug: string; description?: string | null; logo_id?: string | null };
type Engagement = { likes: number; views: number };

function ShopPage() {
  const initial = Route.useLoaderData() as {
    products: { rows: ProductRow[]; total: number; page: number; pageSize: number };
    categories: CategoryRow[];
    brands: BrandRow[];
    promotions: any[];
    engagementMap: Map<string, Engagement>;
  };

  const [searchParams, setSearchParams] = useState<{
    q?: string;
    category?: string;
    brand?: string;
    featured?: string;
    page?: number;
    pageSize?: number;
  }>({
    q: (Route.useSearch() as any)?.q,
    category: (Route.useSearch() as any)?.category,
    brand: (Route.useSearch() as any)?.brand,
    featured: (Route.useSearch() as any)?.featured,
    page: Number((Route.useSearch() as any)?.page) || 1,
    pageSize: Number((Route.useSearch() as any)?.pageSize) || 20,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  const activeCategory = searchParams.category;
  const activeBrand = searchParams.brand;
  const activeQuery = searchParams.q;

  const categoryName = useMemo(() => {
    if (!activeCategory) return null;
    const cat = initial.categories.find((c) => c.slug === activeCategory);
    return cat?.name || null;
  }, [activeCategory, initial.categories]);

  const updateSearch = (patch: Record<string, string | number | boolean | undefined>) => {
    setSearchParams((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  const clearFilters = () => {
    setSearchParams({ q: "", category: "", brand: "", featured: undefined, page: 1, pageSize: searchParams.pageSize || 20 });
  };

  const hasActiveFilters = activeCategory || activeBrand || activeQuery;

  return (
    <div className="container-page py-10">
      {initial.promotions.length > 0 && (
        <div className="mb-8 space-y-4">
          {initial.promotions.map((promo: any) => (
            <Link
              key={promo.id}
              to={promo.link_url || "/shop"}
              className="group relative flex min-h-[180px] items-center overflow-hidden rounded-2xl bg-muted/60"
            >
              {promo.image_id ? (
                <img
                  src={imageOf(promo.image_id, promo.image_url)}
                  alt={promo.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/50 to-transparent" />
              <div className="relative z-10 p-6 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{promo.subtitle}</p>
                <h2 className="font-display text-2xl font-black text-white sm:text-3xl">{promo.title}</h2>
                {promo.link_label ? (
                  <span className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                    {promo.link_label}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Reveal>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Shop</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryName
                ? `${categoryName} — ${initial.products.total} products`
                : `${initial.products.total} products available`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters ? (
                <span className="flex h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </button>
            <button
              onClick={() => setGridCols((v) => (v === 3 ? 4 : 3))}
              className="rounded-md border border-border p-2 hover:bg-muted"
              aria-label="Toggle grid"
            >
              {gridCols === 3 ? <Grid3X3 size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside
          className={`space-y-6 transition-all duration-300 ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide">Filters</h3>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide">Search</h3>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={activeQuery || ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateSearch({ q: e.currentTarget.value });
                    setSearchParams((prev) => ({ ...prev, page: 1 }));
                  }
                }}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide">Categories</h3>
            <ul className="mt-3 space-y-1">
              <li>
                <button
                  onClick={() => updateSearch({ category: undefined })}
                  className={`w-full text-left text-sm transition-colors ${
                    !activeCategory ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All categories
                </button>
              </li>
              {initial.categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to="/shop"
                    search={{ ...searchParams, category: cat.slug, page: 1 }}
                    className={`block text-sm transition-colors ${
                      activeCategory === cat.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {initial.brands.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide">Brands</h3>
              <ul className="mt-3 space-y-1">
                <li>
                  <button
                    onClick={() => updateSearch({ brand: undefined })}
                    className={`w-full text-left text-sm transition-colors ${
                      !activeBrand ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All brands
                  </button>
                </li>
                {initial.brands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      to="/shop"
                      search={{ ...searchParams, brand: brand.slug, page: 1 }}
                      className={`block text-sm transition-colors ${
                        activeBrand === brand.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide">Featured</h3>
            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={searchParams.featured === "true"}
                  onChange={(e) => updateSearch({ featured: e.target.checked ? "true" : undefined })}
                  className="rounded border-border"
                />
                Featured products only
              </label>
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {initial.products.rows.length} of {initial.products.total} products
            </p>
            <select
              value={gridCols}
              onChange={(e) => setGridCols(Number(e.target.value) as 3 | 4)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
            >
              <option value={3}>3 per row</option>
              <option value={4}>4 per row</option>
            </select>
          </div>

          {initial.products.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-bold">No products found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                gridCols === 3
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {initial.products.rows.map((product, i) => (
                <Reveal key={product.id} delay={i * 40}>
                  <ProductCard
                    product={product}
                    likes={initial.engagementMap.get(product.id)?.likes ?? 0}
                    views={initial.engagementMap.get(product.id)?.views ?? 0}
                  />
                </Reveal>
              ))}
            </div>
          )}

          {initial.products.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {initial.products.page} of {initial.products.totalPages}
              </p>
              <div className="flex gap-1">
                <Link
                  to="/shop"
                  search={{
                    ...searchParams,
                    page: Math.max(1, initial.products.page - 1),
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  disabled={initial.products.page <= 1}
                >
                  Previous
                </Link>
                <Link
                  to="/shop"
                  search={{
                    ...searchParams,
                    page: Math.min(initial.products.totalPages, initial.products.page + 1),
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  disabled={initial.products.page >= initial.products.totalPages}
                >
                  Next
                </Link>
              </div>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
