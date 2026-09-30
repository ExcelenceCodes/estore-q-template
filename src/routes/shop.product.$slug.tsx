import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Eye, ShoppingCart, ImageOff, ChevronRight } from "lucide-react";
import { getProduct, getProductEngagement, likeProduct, unlikeProduct, trackProductView } from "@/lib/public.functions";
import { imageOf } from "@/components/site/Icon";
import { useCart } from "@/components/site/CartProvider";
import { Reveal } from "@/components/site/Reveal";
import { site, pageTitle } from "@/lib/site";
import { buildProductSchema, buildBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/shop/product/$slug")({
  loader: async ({ params }) => {
    const result = await getProduct({ data: { slug: params.slug } });
    if (!result) throw notFound();
    const engagement = await getProductEngagement({ data: { productId: result.product.id } });
    return { ...result, engagement };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: pageTitle("Product") }, { name: "robots", content: "noindex" }] };
    }
    const { product, images } = loaderData;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const title = pageTitle(product.title);
    const description = product.description || site.seo.defaultDescription;
    const cover = imageOf(null, product.image_url) ?? imageOf(images?.[0]?.media_id, images?.[0]?.image_url) ?? site.brand.logo;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/shop/product/${params.slug}` },
        ...(cover ? [{ property: "og:image", content: cover }, { name: "twitter:image", content: cover }] : []),
      ],
      links: [{ rel: "canonical", href: `/shop/product/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildProductSchema({
              name: product.title,
              description,
              price: Number(product.price),
              image: cover,
              url: `/shop/product/${params.slug}`,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbSchema("", [
              { name: "Shop", path: "/shop" },
              { name: product.title, path: `/shop/product/${params.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const initial = Route.useLoaderData() as {
    product: any;
    images: any[];
    variants: any[];
    specs: any[];
    engagement: { likes: number; views: number };
  };
  const { addToCart } = useCart();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initial.engagement.likes);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = initial.product;
  const allImages = [
    imageOf(null, product.image_url),
    ...initial.images.map((img: any) => imageOf(img.media_id, img.image_url)),
  ].filter(Boolean) as string[];

  const currentImage = allImages[selectedImage] || allImages[0] || null;

  const handleAddToCart = async () => {
    await addToCart({ productId: product.id });
  };

  const handleLike = async () => {
    if (liked) {
      await unlikeProduct({ data: { productId: product.id } });
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await likeProduct({ data: { productId: product.id } });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  return (
    <div className="container-page py-10">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight size={14} />
        <span className="truncate font-medium text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              {currentImage ? (
                <img src={currentImage} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {allImages.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      selectedImage === idx ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal>
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{product.title}</h1>
              <div className="mt-3 flex items-end gap-3">
                <span className="font-display text-3xl font-black text-primary">
                  TZS {Number(product.price).toLocaleString()}
                </span>
                {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                  <span className="text-sm text-muted-foreground line-through">
                    TZS {Number(product.compare_at_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye size={14} /> {initial.engagement.views} views
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={14} /> {likeCount} likes
              </span>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ShoppingCart size={16} />
                Add to cart
              </button>
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition ${
                  liked ? "border-destructive text-destructive" : "border-border hover:bg-muted"
                }`}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked" : "Like"}
              </button>
            </div>
          </Reveal>

          {initial.variants.length > 0 && (
            <Reveal delay={200}>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Variants</h3>
                <div className="mt-3 space-y-2">
                  {initial.variants.map((v: any) => (
                    <div key={v.id} className="rounded-lg border border-border p-3 text-sm">
                      <span className="font-medium">{v.title}</span>
                      {v.sku && <span className="ml-2 text-xs text-muted-foreground">SKU: {v.sku}</span>}
                      {v.inventory_quantity !== undefined && (
                        <span className="ml-2 text-xs text-muted-foreground">Stock: {v.inventory_quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {initial.specs.length > 0 && (
            <Reveal delay={240}>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Specifications</h3>
                <div className="mt-3 space-y-2">
                  {initial.specs.map((s: any) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.spec_definition?.name}</span>
                      <span className="font-medium">{s.value_text || s.value_number || s.value_boolean?.toString() || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
