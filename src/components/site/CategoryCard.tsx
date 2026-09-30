import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { imageOf } from "@/components/site/Icon";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_id?: string | null;
};

export function CategoryCard({ category }: { category: Category }) {
  const image = imageOf(category.image_id);

  return (
    <Link
      to="/shop"
      search={{ category: category.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-sm font-bold leading-snug group-hover:text-primary">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
        )}
      </div>
    </Link>
  );
}
