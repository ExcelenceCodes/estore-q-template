import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { HeroSettings } from "@/lib/public.functions";

export function Hero({ hero }: { hero: HeroSettings }) {
  const slides = hero?.slides ?? [];
  const slideshow = hero?.mode === "slideshow" && slides.length > 0;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slideshow || slides.length < 2) return;
    const ms = hero.autoplayMs || 6000;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), ms);
    return () => clearInterval(t);
  }, [slideshow, slides.length, hero?.autoplayMs]);

  const current = slides[index] ?? slides[0];

  return (
    <section className="relative isolate overflow-hidden">
      {slideshow ? (
        <>
          {slides.map((s, i) => (
            <div
              key={s.url}
              aria-hidden={i !== index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                i === index
                  ? "opacity-100"
                  : "opacity-0" /* removed animate-slide-bg so slides start clear */
              }`}
              style={{ backgroundImage: `url(${s.url})` }}
            />
          ))}
          {/* overlay commented out — slides now stay clear for their full duration
          <div
            className="absolute inset-0 bg-ink"
            style={{ opacity: hero.overlay ?? 0.55 }}
          />
          */}
        </>
      ) : (
        <div className="absolute inset-0 bg-primary" />
      )}

      <div className="hero-bg absolute inset-y-0 left-0 w-full bg-primary/80 lg:w-2/3 lg:hover:w-full" />

      <div className="container-page relative flex h-[540px] flex-col justify-center py-24 md:h-[620px]">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-foreground backdrop-blur">
            Business & Investment Consultancy
          </p>
          <h1
            key={hero?.animateText ? `t-${index}` : "t"}
            className={`font-display text-4xl font-black leading-[1.05] text-ink-foreground sm:text-5xl lg:text-6xl ${
              hero?.animateText ? "animate-rise" : ""
            }`}
          >
            {current?.title}
          </h1>
          <p
            key={hero?.animateText ? `s-${index}` : "s"}
            className={`mt-5 max-w-xl text-base leading-relaxed text-ink-foreground/85 sm:text-lg ${
              hero?.animateText ? "animate-rise" : ""
            }`}
            style={{ animationDelay: "120ms" }}
          >
            {current?.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {current?.ctaHref ? (
              <a
                href={current.ctaHref}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {current.ctaLabel || "Learn more"}
                <ArrowRight size={16} />
              </a>
            ) : null}
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 rounded-md border border-white/35 px-6 py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-white/10"
            >
              Book a consultation
            </Link>
          </div>
        </div>

        {slideshow && slides.length > 1 ? (
          <div className="mt-12 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.url}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-10 bg-primary" : "w-5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
