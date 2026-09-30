import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";

export function PageBanner({
  title,
  crumb,
  image,
}: {
  title: string;
  crumb: string;
  image?: string | null;
}) {
  const bg = image || site.brand.bannerImage;
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="container-page relative py-16 sm:py-20">
        <h1 className="font-display text-3xl font-black text-ink-foreground sm:text-4xl">
          {title}
        </h1>
        <nav
          aria-label="Breadcrumb"
          className="mt-3 flex items-center gap-1 text-xs text-ink-foreground/75"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight size={13} />
          <span className="text-accent">{crumb}</span>
        </nav>
      </div>
    </section>
  );
}
