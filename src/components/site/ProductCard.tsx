import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Eye, ImageOff } from "lucide-react";
import { imageOf } from "@/components/site/Icon";
import { useCart } from "@/components/site/CartProvider";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price?: string | null;
  image_url?: string | null;
  featured?: boolean;
  brand_id?: string | null;
};

type ProductCardProps = {
  product: Product;
  likes?: number;
  views?: number;
};

export function ProductCard({ product, likes = 0, views = 0 }: ProductCardProps) {
  const image = imageOf(null, product.image_url || null);
  const { addToCart } = useCart();
  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ productId: product.id });
  };

  return (
    <Link
      to="/shop/product/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
            SALE
          </span>
        )}
        {product.featured && (
          <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            Featured
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent p-2 transition-transform duration-300 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <ShoppingCart size={14} />
            Add to cart
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug group-hover:text-primary">
          {product.title}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="font-display text-lg font-black">
              TZS {Number(product.price).toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                TZS {Number(product.compare_at_price).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {likes > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Heart size={12} />
                {likes}
              </span>
            )}
            {views > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Eye size={12} />
                {views}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
