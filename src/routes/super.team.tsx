import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Save, Trash2, X } from "lucide-react";
import { adminListTeam, saveTeamMember, deleteTeamMember } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  ImagePicker,
  PageHeading,
  Panel,
  useAction,
} from "@/components/admin/ui";
import { imageOf } from "@/components/site/Icon";

type Draft = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo_id: string | null;
  photo_url: string | null;
  order_index: number;
};

const empty: Draft = {
  name: "",
  role: "",
  bio: "",
  photo_id: null,
  photo_url: null,
  order_index: 0,
};

export const Route = createFileRoute("/super/team")({
  loader: () => adminListTeam(),
  component: TeamAdmin,
});

function TeamAdmin() {
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
    const ok = await execute("save", () => saveTeamMember({ data: draft }), "Team member saved");
    if (ok) {
      setDraft(null);
      await router.invalidate();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this team member?")) return;
    await execute(`delete-${id}`, () => deleteTeamMember({ data: { id } }), "Team member deleted");
    await router.invalidate();
  }

  return (
    <>
      <PageHeading
        title="Team"
        description="People shown on the about page."
        action={
          <button
            onClick={() => setDraft({ ...empty, order_index: rows.length })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New member
          </button>
        }
      />

      {draft ? (
        <div className="mb-6">
          <Panel
            title={draft.id ? "Edit member" : "New member"}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => void execute("save", save, "Team member saved")}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
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
                <button
                  onClick={() => setDraft(null)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Role">
                <input
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </Field>
              <Field label="Short bio">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </Field>
              <div className="space-y-4">
                <ImagePicker
                  label="Passport photo"
                  mediaId={draft.photo_id}
                  onChange={(photo_id) => setDraft({ ...draft, photo_id })}
                />
                <Field label="Display order">
                  <input
                    type="number"
                    className={inputClass}
                    value={draft.order_index}
                    onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-border bg-muted">
                {imageOf(row.photo_id, row.photo_url) ? (
                  <img
                    src={imageOf(row.photo_id, row.photo_url)!}
                    alt={row.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="truncate text-sm text-muted-foreground">{row.role}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: row.id,
                    name: row.name,
                    role: row.role ?? "",
                    bio: row.bio ?? "",
                    photo_id: row.photo_id ?? null,
                    order_index: row.order_index ?? 0,
                  })
                }
                className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Remove ${row.name}?`)) return;
                  await execute(
                    `delete-${row.id}`,
                    () => deleteTeamMember({ data: { id: row.id } }),
                    "Removed",
                  );
                  await router.invalidate();
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive"
                disabled={loading === `delete-${row.id}`}
              >
                {loading === `delete-${row.id}` ? "..." : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
