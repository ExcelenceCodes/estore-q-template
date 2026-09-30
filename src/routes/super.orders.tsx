import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { adminListOrders, adminGetOrder, updateOrderStatus } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  PageHeading,
  Panel,
  Pagination,
  useAction,
} from "@/components/admin/ui";

export const Route = createFileRoute("/super/orders")({
  loader: () => adminListOrders({ data: { pageSize: 50 } }),
  component: OrdersAdmin,
});

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

function OrdersAdmin() {
  const initial = Route.useLoaderData();
  const [page, setPage] = useState(initial.page);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ status: "" as string, note: "" });
  const { loading, execute } = useAction();

  const refresh = async (p = page) => {
    const data = await adminListOrders({ data: { page: p, pageSize: 50 } });
    setPage(data.page);
  };

  const viewOrder = async (id: string) => {
    const data = await adminGetOrder({ data: { id } });
    setDetail(data);
    setExpanded(id);
    setStatusForm({ status: data?.order?.status ?? "", note: "" });
  };

  const handleStatusUpdate = async (orderId: string) => {
    const ok = await execute(
      "status",
      () =>
        updateOrderStatus({
          data: { id: orderId, status: statusForm.status as any, note: statusForm.note || null },
        }),
      "Order updated",
    );
    if (ok) {
      const data = await adminGetOrder({ data: { id: orderId } });
      setDetail(data);
      refresh();
    }
  };

  return (
    <>
      <PageHeading title="Orders" description="Manage and track customer orders." />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 font-semibold">Order</th>
                <th className="pb-2 font-semibold">Customer</th>
                <th className="pb-2 font-semibold">Total</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Placed</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initial.rows.map((row: any) => (
                <>
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => (expanded === row.id ? setExpanded(null) : viewOrder(row.id))}
                  >
                    <td className="py-3 font-medium">{row.order_number}</td>
                    <td className="py-3 text-muted-foreground">
                      {row.guest_name} <br />
                      <span className="text-xs">{row.guest_email}</span>
                    </td>
                    <td className="py-3">TZS {Number(row.total).toLocaleString()}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${row.status === "delivered" ? "bg-primary/10 text-primary" : row.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(row.placed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {expanded === row.id ? (
                        <ChevronUp className="h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="h-4 w-4 inline" />
                      )}
                    </td>
                  </tr>
                  {expanded === row.id && detail && detail.order?.id === row.id && (
                    <tr>
                      <td colSpan={6} className="p-4">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <h4 className="font-semibold mb-2">Order Items</h4>
                            <div className="space-y-2 text-sm">
                              {detail.items?.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between rounded-md border border-border p-2"
                                >
                                  <span>Product {item.product_id.slice(0, 8)}...</span>
                                  <span className="font-semibold">
                                    TZS {(Number(item.unit_price) * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              {detail.items?.length === 0 && (
                                <p className="text-muted-foreground">No items.</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Update Status</h4>
                            <div className="space-y-3">
                              <Field label="Status">
                                <select
                                  className={inputClass}
                                  value={statusForm.status}
                                  onChange={(e) =>
                                    setStatusForm({ ...statusForm, status: e.target.value })
                                  }
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Note">
                                <textarea
                                  className={inputClass}
                                  rows={2}
                                  value={statusForm.note}
                                  onChange={(e) =>
                                    setStatusForm({ ...statusForm, note: e.target.value })
                                  }
                                />
                              </Field>
                              <button
                                onClick={() => handleStatusUpdate(row.id)}
                                disabled={loading === "status"}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                              >
                                {loading === "status" ? "Updating..." : "Update status"}
                              </button>
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">History</h4>
                                <div className="space-y-1 text-sm">
                                  {detail.history?.map((h: any) => (
                                    <div
                                      key={h.id}
                                      className="flex justify-between rounded-md border border-border p-2"
                                    >
                                      <span className="capitalize">{h.status}</span>
                                      <span className="text-muted-foreground">
                                        {h.note || ""} · {new Date(h.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                  {detail.history?.length === 0 && (
                                    <p className="text-muted-foreground">No history.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {initial.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={initial.totalPages} onPageChange={setPage} />
      </Panel>
    </>
  );
}
