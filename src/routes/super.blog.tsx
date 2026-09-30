import { useState, useMemo, useRef } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Plus,
  Trash2,
  Save,
  X,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
} from "lucide-react";
import {
  adminListArticles,
  createArticle,
  saveArticle,
  deleteArticle,
} from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  ImagePicker,
  useAction,
} from "@/components/admin/ui";
import { slugify } from "@/lib/admin-client";
import { markdownToHtml } from "@/lib/markdown";
import { mediaUrl } from "@/components/site/Icon";

export const Route = createFileRoute("/super/blog")({
  loader: () => adminListArticles(),
  component: BlogAdmin,
});

type Draft = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_id: string | null;
  cover_url: string | null;
  tags: string[];
  author: string;
  status: "draft" | "published";
};

const empty: Draft = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_id: null,
  cover_url: null,
  tags: [],
  author: "Editorial Team",
  status: "draft",
};

type Tool = {
  label: string;
  icon: React.ReactNode;
  prefix: string;
  suffix: string;
  placeholder: string;
  block?: boolean;
};

const TOOLS: Tool[] = [
  {
    label: "H1",
    icon: <Heading1 size={16} />,
    prefix: "# ",
    suffix: "",
    placeholder: "Heading 1",
    block: true,
  },
  {
    label: "H2",
    icon: <Heading2 size={16} />,
    prefix: "## ",
    suffix: "",
    placeholder: "Heading 2",
    block: true,
  },
  {
    label: "H3",
    icon: <Heading3 size={16} />,
    prefix: "### ",
    suffix: "",
    placeholder: "Heading 3",
    block: true,
  },
  { label: "Bold", icon: <Bold size={16} />, prefix: "**", suffix: "**", placeholder: "bold text" },
  {
    label: "Italic",
    icon: <Italic size={16} />,
    prefix: "*",
    suffix: "*",
    placeholder: "italic text",
  },
  {
    label: "Bullets",
    icon: <List size={16} />,
    prefix: "- ",
    suffix: "",
    placeholder: "List item",
    block: true,
  },
  {
    label: "Numbers",
    icon: <ListOrdered size={16} />,
    prefix: "1. ",
    suffix: "",
    placeholder: "List item",
    block: true,
  },
  {
    label: "Quote",
    icon: <Quote size={16} />,
    prefix: "> ",
    suffix: "",
    placeholder: "Quote",
    block: true,
  },
  {
    label: "Link",
    icon: <LinkIcon size={16} />,
    prefix: "[",
    suffix: "](url)",
    placeholder: "link text",
  },
  { label: "Code", icon: <Code size={16} />, prefix: "`", suffix: "`", placeholder: "code" },
];

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  tool: Tool,
  setDraft: (updater: (d: Draft) => Draft) => void,
) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const selected = textarea.value.slice(start, end) || tool.placeholder;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);

  let insertion = "";
  let newCursorStart = start;
  let newCursorEnd = end;

  if (tool.block) {
    const lineStart = before.lastIndexOf("\n") + 1;
    const lineBefore = before.slice(lineStart);
    const fullLine = lineBefore + selected + after.split("\n")[0];
    const nextNewline = after.indexOf("\n");
    const rest = nextNewline === -1 ? "" : after.slice(nextNewline);

    insertion = before.slice(0, lineStart) + tool.prefix + selected + rest;
    newCursorStart = lineStart + tool.prefix.length;
    newCursorEnd = newCursorStart + selected.length;
  } else {
    insertion = before + tool.prefix + selected + tool.suffix;
    newCursorStart = start + tool.prefix.length;
    newCursorEnd = newCursorStart + selected.length;
  }

  setDraft((d) => ({ ...d, body: insertion }));
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(newCursorStart, newCursorEnd);
  });
}

function BlogAdmin() {
  const data = Route.useLoaderData() as {
    rows: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  const rows = data.rows;
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const { loading, execute } = useAction();

  const filtered = useMemo(() => {
    let data = rows;
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (r) => r.title.toLowerCase().includes(q) || (r.excerpt ?? "").toLowerCase().includes(q),
      );
    }
    return data;
  }, [rows, statusFilter, search]);

  async function save() {
    if (!draft) return;
    const payload = {
      ...draft,
      slug: draft.slug || slugify(draft.title),
      tags: draft.tags.map((t) => t.trim()).filter(Boolean),
    };
    const ok = await execute("save", () => saveArticle({ data: payload }), "Article saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function createNew() {
    const { id } = await createArticle();
    setDraft({
      ...empty,
      id,
      slug: "",
      title: "",
      excerpt: "",
      body: "",
      cover_id: null,
      cover_url: null,
      tags: [],
      author: "Editorial Team",
      status: "draft",
    });
    await router.invalidate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this article permanently?")) return;
    await execute(`delete-${id}`, () => deleteArticle({ data: { id } }), "Article deleted");
    await router.invalidate();
    if (draft?.id === id) setDraft(null);
  }

  return (
    <>
      <PageHeading
        title="Blog studio"
        description="Manage articles and blog posts shown on the website."
        action={
          <button
            onClick={async () => await execute("create", createNew, "Article created")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={loading === "create"}
          >
            {loading === "create" ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4" /> New article
              </>
            )}
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit article" : "New article"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={() => void execute("save", save, "Article saved")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                  disabled={loading === "save"}
                >
                  {loading === "save" ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                  )}
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      title: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Slug" hint="Used in the URL.">
                <input
                  className={inputClass}
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                />
              </Field>
              <Field label="Author">
                <input
                  className={inputClass}
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as "draft" | "published" })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Excerpt" hint="Short summary shown in listings.">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={draft.excerpt}
                    onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Body"
                  hint="Full article content. Use the toolbar to format, then preview on the right."
                >
                  <div className="rounded-md border border-border">
                    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
                      {TOOLS.map((tool) => (
                        <button
                          key={tool.label}
                          type="button"
                          title={tool.label}
                          onClick={() => {
                            if (!bodyRef.current || !draft) return;
                            insertMarkdown(bodyRef.current, tool, setDraft);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-primary"
                        >
                          {tool.icon}
                        </button>
                      ))}
                    </div>
                    <textarea
                      ref={bodyRef}
                      rows={12}
                      className={`${inputClass} border-0 rounded-none focus-visible:ring-0`}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="# Heading&#10;&#10;Write your article here..."
                    />
                  </div>
                  <div
                    className="prose-article mt-3 overflow-hidden rounded-md border border-border bg-background p-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        markdownToHtml(draft.body) ||
                        '<div class="text-muted-foreground">Preview will appear here...</div>',
                    }}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Tags" hint="One tag per line.">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={draft.tags.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        tags: e.target.value
                          .split("\n")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <ImagePicker
                    imageUrl={draft.cover_url}
                    label="Cover picture"
                    onChange={(id) =>
                      setDraft({
                        ...draft,
                        cover_id: id,
                        cover_url: id ? (mediaUrl(id) ?? "") : "",
                      })
                    }
                  />
                  <Field label="Picture link" hint="Or paste an online image address.">
                    <input
                      className={inputClass}
                      value={draft.cover_url ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, cover_url: e.target.value, cover_id: null })
                      }
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            className={inputClass}
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} article{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4">
        {filtered.map((row) => (
          <article key={row.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold">{row.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.status === "published"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
                  {row.excerpt || "No excerpt"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  By {row.author || "Unknown"} • {row.tags?.join(", ") || "No tags"}
                </p>
                {row.body ? (
                  <p className="mt-2 line-clamp-3 break-words text-sm text-muted-foreground">
                    {row.body.replace(/[#*_>`]/g, "").slice(0, 180)}
                    {row.body.length > 180 ? "…" : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setDraft({
                      id: row.id,
                      slug: row.slug,
                      title: row.title,
                      excerpt: row.excerpt ?? "",
                      body: row.body ?? "",
                      cover_id: row.cover_id,
                      cover_url: row.cover_url,
                      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
                      author: row.author ?? "Editorial Team",
                      status: row.status,
                    })
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    execute(`delete-${row.id}`, () => remove(row.id), "Article deleted")
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                  disabled={loading === `delete-${row.id}`}
                >
                  {loading === `delete-${row.id}` ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No articles found.
          </div>
        ) : null}
      </div>
    </>
  );
}
