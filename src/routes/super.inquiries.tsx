import { useState, useMemo } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { adminListInquiries, setInquiryHandled, deleteInquiry } from "@/lib/admin.functions";
import {
  Field,
  PageHeading,
  Panel,
  useAction,
  Pagination,
  inputClass,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/admin-client";

export const Route = createFileRoute("/super/inquiries")({
  loader: () => adminListInquiries(),
  component: InquiriesAdmin,
});

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

type InquiriesResponse = {
  rows: InquiryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function groupByDate(rows: InquiryRow[]) {
  const groups = new Map<string, InquiryRow[]>();
  for (const row of rows) {
    const date = String(row.created_at).slice(0, 10);
    const list = groups.get(date) ?? [];
    list.push(row);
    groups.set(date, list);
  }
  return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function InquiriesAdmin() {
  const data = Route.useLoaderData() as InquiriesResponse;
  const router = useRouter();
  const { loading, execute } = useAction();
  const [page, setPage] = useState(data.page);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const groups = useMemo(() => groupByDate(data.rows), [data.rows]);

  async function load(opts: Partial<{ page: number; q: string; from: string; to: string }> = {}) {
    const q = opts.q !== undefined ? opts.q : search;
    const from = opts.from !== undefined ? opts.from : dateFrom;
    const to = opts.to !== undefined ? opts.to : dateTo;
    await router.invalidate({
      load: {
        loader: () => adminListInquiries({ data: { page: opts.page ?? page, q, from, to } }),
      },
    });
    if (opts.page) setPage(opts.page);
  }

  async function toggleHandled(id: string, handled: boolean) {
    await execute(id, () => setInquiryHandled({ data: { id, handled: !handled } }), "Updated");
    await load({ page });
  }

  async function remove(id: string) {
    if (!confirm("Delete this inquiry permanently?")) return;
    await execute(`delete-${id}`, () => deleteInquiry({ data: { id } }), "Inquiry deleted");
    await load({ page: Math.min(page, Math.max(1, data.totalPages - 1)) });
  }

  return (
    <>
      <PageHeading title="Inquiries" description="Messages sent from the contact page." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Search">
            <input
              className={inputClass}
              placeholder="Search inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load({ page: 1 })}
            />
          </Field>
          <Field label="From">
            <input
              type="date"
              className={inputClass}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load({ page: 1 })}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              className={inputClass}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load({ page: 1 })}
            />
          </Field>
        </div>
        <button
          onClick={() => load({ page: 1 })}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          Apply
        </button>
      </div>

      <Panel>
        {data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inquiries found.</p>
        ) : (
          <div className="space-y-6">
            {groups.map(([date, rows]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatDate(date)}
                </p>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{row.name}</p>
                          <span className="text-xs text-muted-foreground">· {row.email}</span>
                        </div>
                        <p className="text-sm font-medium">{row.subject || "No subject"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{row.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleHandled(row.id, row.handled)}
                          className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted ${
                            row.handled ? "text-muted-foreground" : "text-primary"
                          }`}
                          disabled={loading === row.id}
                        >
                          {loading === row.id ? (
                            "..."
                          ) : (
                            <>
                              {row.handled ? (
                                <MailOpen className="h-4 w-4" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                              {row.handled ? "Reopen" : "Mark handled"}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => remove(row.id)}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(p) => load({ page: p })}
        />
      </Panel>
    </>
  );
}
