import { useState, useMemo, type ReactNode } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Save, X, Search } from "lucide-react";
import { adminListSocials, saveSocials, deleteSocial } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, useAction } from "@/components/admin/ui";
import { Icon, SocialIcon, socialIcons } from "@/components/site/Icon";

type Draft = {
  id?: string;
  platform: string;
  url: string;
  enabled: boolean;
  order_index: number;
  icon: string;
};

const empty: Draft = {
  platform: "",
  url: "",
  enabled: false,
  order_index: 0,
  icon: "link",
};

const ICON_OPTIONS = [
  "link",
  "globe",
  "mail",
  "phone",
  "message-circle",
  "send",
  "share-2",
  "at-sign",
  "rss",
  "bookmark",
  "music",
  "video",
  "image",
  "file-text",
  "calendar",
  "map-pin",
  "home",
  "briefcase",
  "graduation-cap",
  "heart",
  "star",
  "thumbs-up",
  "award",
  "trophy",
  "flag",
  "bell",
  "settings",
  "help-circle",
  "info",
  "shield",
  "lock",
  "unlock",
  "key",
  "eye",
  "eye-off",
  "user",
  "users",
  "user-plus",
  "camera",
  "mic",
  "headphones",
  "monitor",
  "smartphone",
  "tablet",
  "printer",
  "wifi",
  "bluetooth",
  "cpu",
  "hard-drive",
  "database",
  "cloud",
  "sun",
  "moon",
  "zap",
  "flame",
  "droplets",
  "wind",
  "anchor",
  "compass",
  "map",
  "arrow-up-right",
  "external-link",
  "download",
  "upload",
  "refresh-cw",
  "repeat",
  "shuffle",
  "skip-forward",
  "play",
  "pause",
  "square",
  "circle",
  "triangle",
  "hexagon",
  "octagon",
  "pentagon",
  "star-half",
  "facebook",
  "twitter",
  "x",
  "linkedin",
  "instagram",
  "youtube",
  "whatsapp",
  "tiktok",
  "telegram",
  "github",
];

function LucideIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_OPTIONS.slice(0, 24);
    return ICON_OPTIONS.filter((name) => name.includes(q)).slice(0, 24);
  }, [query]);

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Icon
      </span>
      <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <Icon name={value || "link"} className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <input
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            list="lucide-icons"
            placeholder="Search icon name..."
          />
          <datalist id="lucide-icons">
            {matches.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {matches.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition hover:border-primary ${
              value === name ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Icon name={name} className="h-3.5 w-3.5" />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/super/socials")({
  loader: () => adminListSocials(),
  component: SocialsAdmin,
});

function SocialsAdmin() {
  const { rows } = Route.useLoaderData() as {
    rows: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const { loading, execute } = useAction();

  async function save() {
    if (!draft) return;
    const payload = {
      rows: [
        ...rows.filter((r: any) => r.id !== draft.id),
        { ...draft, order_index: draft.order_index },
      ],
    };
    const ok = await execute("save", () => saveSocials({ data: payload }), "Socials saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function toggle(id: string, enabled: boolean) {
    const payload = {
      rows: rows.map((r: any) => (r.id === id ? { ...r, enabled: !enabled } : r)),
    };
    await execute(
      id,
      () => saveSocials({ data: payload }),
      enabled ? "Social disabled" : "Social enabled",
    );
    await router.invalidate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this social link?")) return;
    await execute(`delete-${id}`, () => deleteSocial({ data: { id } }), "Social deleted");
    await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Socials"
        description="Social links shown on the website."
        action={
          <button
            onClick={() => setDraft({ ...empty, order_index: rows.length })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New link
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit social" : "New social"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={() => void execute("save", save, "Socials saved")}
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
              <Field label="Platform">
                <input
                  className={inputClass}
                  value={draft.platform}
                  onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
                />
              </Field>
              <Field label="URL">
                <input
                  className={inputClass}
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </Field>
              <Field label="Order">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.order_index}
                  onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) })}
                />
              </Field>
              <label className="flex items-center gap-2 self-end text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                />
                Enabled
              </label>
              <div className="md:col-span-2">
                <LucideIconPicker
                  value={draft.icon}
                  onChange={(icon) => setDraft({ ...draft, icon })}
                />
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">
          {rows.map((row: any) => (
            <div key={row.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const brandColor = socialIcons[row.platform.toLowerCase()]?.color ?? "#64748b";
                  return (
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <SocialIcon platform={row.platform} className="h-4 w-4" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-semibold capitalize">{row.platform}</p>
                  <p className="text-sm text-muted-foreground">{row.url || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={() => void toggle(row.id, row.enabled)}
                  />
                  {row.enabled ? "On" : "Off"}
                </label>
                <button
                  onClick={() =>
                    setDraft({
                      id: row.id,
                      platform: row.platform,
                      url: row.url ?? "",
                      enabled: row.enabled,
                      order_index: row.order_index ?? 0,
                      icon: row.icon ?? "link",
                    })
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    execute(`delete-${row.id}`, () => remove(row.id), "Social deleted")
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                  disabled={loading === `delete-${row.id}`}
                >
                  {loading === `delete-${row.id}` ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No social links yet.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
