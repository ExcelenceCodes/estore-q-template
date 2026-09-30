import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { getSetting, saveSetting } from "@/lib/admin.functions";
import { Field, inputClass, PageHeading, Panel, useAction } from "@/components/admin/ui";
import type { ContactSettings } from "@/lib/public.functions";

const fallback: ContactSettings = {
  companyName: "",
  addressLines: [],
  phones: [],
  emails: [],
  hours: [],
  map: { enabled: true, query: "", zoom: 15 },
};

export const Route = createFileRoute("/super/contacts")({
  loader: async () =>
    ((await getSetting({ data: { key: "contacts" } })) as ContactSettings) ?? fallback,
  component: ContactsAdmin,
});

function ListEditor({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {values.map((value, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputClass}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="rounded-md border border-border px-2 text-muted-foreground hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

function ContactsAdmin() {
  const loaded = Route.useLoaderData();
  const router = useRouter();
  const [data, setData] = useState<ContactSettings>({ ...fallback, ...(loaded ?? {}) });
  const { loading, execute } = useAction();

  const patch = (patch: Partial<ContactSettings>) => setData({ ...data, ...patch });

  return (
    <>
      <PageHeading
        title="Contacts"
        description="Phone numbers, emails, address, working hours and the map."
        action={
          <button
            onClick={() =>
              void execute(
                "save",
                () => saveSetting({ data: { key: "contacts", value: data } }),
                "Contacts saved",
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={loading === "save"}
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        }
      />

      <div className="space-y-6">
        <Panel title="Company">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name">
              <input
                className={inputClass}
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
              />
            </Field>
            <ListEditor
              label="Address lines"
              values={data.addressLines ?? []}
              placeholder="Street, city"
              onChange={(addressLines) => setData({ ...data, addressLines })}
            />
            <ListEditor
              label="Phone numbers"
              values={data.phones ?? []}
              placeholder="+255 ..."
              onChange={(phones) => setData({ ...data, phones })}
            />
            <ListEditor
              label="Email addresses"
              values={data.emails ?? []}
              placeholder="info@company.co.tz"
              onChange={(emails) => setData({ ...data, emails })}
            />
          </div>
        </Panel>

        <Panel title="Working hours">
          <div className="space-y-2">
            {(data.hours ?? []).map((row, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <input
                  className={`${inputClass} sm:max-w-[220px]`}
                  value={row.label}
                  placeholder="Monday - Friday"
                  onChange={(e) =>
                    setData({
                      ...data,
                      hours: data.hours.map((h, j) =>
                        j === i ? { ...h, label: e.target.value } : h,
                      ),
                    })
                  }
                />
                <input
                  className={`${inputClass} sm:max-w-[220px]`}
                  value={row.value}
                  placeholder="08:00 - 17:00"
                  onChange={(e) =>
                    setData({
                      ...data,
                      hours: data.hours.map((h, j) =>
                        j === i ? { ...h, value: e.target.value } : h,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setData({ ...data, hours: data.hours.filter((_, j) => j !== i) })}
                  className="rounded-md border border-border px-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setData({ ...data, hours: [...(data.hours ?? []), { label: "", value: "" }] })
              }
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          </div>
        </Panel>

        <Panel title="Map" description="Shown on the contact page.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Show map">
              <select
                className={inputClass}
                value={data.map?.enabled ? "yes" : "no"}
                onChange={(e) =>
                  setData({ ...data, map: { ...data.map, enabled: e.target.value === "yes" } })
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Location search" hint="Address or place name used by Google Maps.">
              <input
                className={inputClass}
                value={data.map?.query ?? ""}
                onChange={(e) => setData({ ...data, map: { ...data.map, query: e.target.value } })}
              />
            </Field>
            <Field label="Zoom">
              <input
                type="number"
                min={1}
                max={21}
                className={inputClass}
                value={data.map?.zoom ?? 15}
                onChange={(e) =>
                  setData({ ...data, map: { ...data.map, zoom: Number(e.target.value) } })
                }
              />
            </Field>
          </div>
        </Panel>
      </div>
    </>
  );
}
