"use client";

import { useEffect, useRef, useState } from "react";

const currentYear = new Date().getFullYear();
const startYear = 2016;
const yearsOfExperience = currentYear - startYear;

function CountUp({
  target,
  visible,
  suffix = "",
}: {
  target: number;
  visible: boolean;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [visible, target]);

  return (
    <span className="flex items-baseline gap-1">
      <span className="text-4xl font-black tracking-tight text-ink">{value}</span>
      {suffix ? <span className="text-lg font-bold text-primary">{suffix}</span> : null}
    </span>
  );
}

export function YearsOfExperience({ customersServed = 500 }: { customersServed?: number }) {
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -20px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cardBase =
    "flex-1 rounded-2xl border-l-2 border-t-2 border-primary bg-card p-5 shadow-sm relative overflow-hidden";

  return (
    <div ref={rootRef} className="mt-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className={cardBase}>
          <CountUp target={yearsOfExperience} visible={visible} suffix="+" />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Years of experience
          </p>
          <div className="mt-3 flex h-1 w-full gap-1 rounded-full bg-ink/10 p-0.5">
            {Array.from({ length: yearsOfExperience }, (_, i) => (
              <span
                key={i}
                className="h-full flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    visible && i < yearsOfExperience ? "var(--color-primary)" : "transparent",
                  transform: visible && i < yearsOfExperience ? "scaleY(1)" : "scaleY(0.5)",
                  transitionDelay: visible ? `${i * 40}ms` : "0ms",
                }}
              />
            ))}
          </div>
        </div>

        <div className={cardBase}>
          <CountUp target={customersServed} visible={visible} suffix="+" />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Customers served
          </p>
          <div className="mt-3 flex h-1 w-full gap-1 rounded-full bg-ink/10 p-0.5">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="h-full flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: visible && i < 12 ? "var(--color-primary)" : "transparent",
                  transform: visible && i < 12 ? "scaleY(1)" : "scaleY(0.5)",
                  transitionDelay: visible ? `${i * 40}ms` : "0ms",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
