import React, { useState, useCallback, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { imageOf } from "@/components/site/Icon";
import { filePayload } from "@/lib/admin-client";
import { uploadMedia } from "@/lib/admin.functions";

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Uploads a picked image into the media table and returns its id. */
export function ImagePicker({
  mediaId,
  imageUrl,
  onChange,
  onDimensions,
  label = "Image",
}: {
  mediaId?: string | null;
  imageUrl?: string | null;
  onChange: (id: string | null) => void;
  onDimensions?: (width: number, height: number) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const preview = imageOf(mediaId, imageUrl ?? null);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await filePayload(file);
      const { id } = await uploadMedia({ data: payload });
      onChange(id);
      if (payload.width && payload.height) {
        onDimensions?.(payload.width, payload.height);
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {preview ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="h-full w-full cursor-zoom-in"
              aria-label="Preview image"
            >
              <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ) : null}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{busy ? "Uploading" : "Choose file"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
        </label>
        {preview ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
      </div>

      {lightbox && preview && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setLightbox(false);
              }}
            >
              <button
                type="button"
                onClick={() => setLightbox(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={preview}
                alt=""
                className="max-h-[85vh] max-w-full rounded-md object-contain shadow-2xl"
                loading="lazy"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export async function run(action: () => Promise<unknown>, message: string) {
  try {
    await action();
    toast.success(message);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Something went wrong");
    return false;
  }
}

export function useAction() {
  const [loading, setLoading] = useState<string | null>(null);

  const execute = useCallback(
    async (id: string, action: () => Promise<unknown>, message: string) => {
      setLoading(id);
      const ok = await run(action, message);
      setLoading(null);
      return ok;
    },
    [],
  );

  return { loading, execute };
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <nav className="mt-6 flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
