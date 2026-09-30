import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { customerMe, getOrderByNumber } from "@/lib/public.functions";
import { PageHeading, Panel, useAction } from "@/components/admin/ui";
import { Package } from "lucide-react";

export const Route = createFileRoute("/account/orders")({
  loader: async () => {
    const me = await customerMe();
    if (!me) throw redirect({ to: "/account/login" });
    return me;
  },
  component: OrdersPage,
});

function OrdersPage() {
  const user = Route.useLoaderData();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const { loading, execute } = useAction();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await getOrderByNumber({ data: { orderNumber, email: user.email } });
    setOrder(result);
  };

  return (
    <div>
      <PageHeading
        title="My Orders"
        description={`Welcome, ${user.name}. Track and view your orders below.`}
      />
      <Panel title="Track an order" description="Enter your order number to see details.">
        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            className={inputClass}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-XXX"
            required
          />
          <button
            type="submit"
            disabled={loading === "track"}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Track
          </button>
        </form>
      </Panel>
      {order && (
        <Panel
          title={`Order #${order.order.order_number}`}
          description={`Placed on ${new Date(order.order.created_at).toLocaleDateString()}`}
        >
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold">TZS {Number(order.order.subtotal).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipping</p>
              <p className="font-semibold">TZS {Number(order.order.shipping).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-bold">TZS {Number(order.order.total).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize">
                {order.order.status}
              </span>
            </div>
          </div>
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between rounded-md border border-border p-3 text-sm"
              >
                <span>Product {item.product_id.slice(0, 8)}...</span>
                <span className="font-semibold">
                  TZS {(Number(item.unit_price) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <h4 className="font-semibold mt-6 mb-2">History</h4>
          <div className="space-y-2">
            {order.history.map((h: any) => (
              <div
                key={h.id}
                className="flex justify-between rounded-md border border-border p-2 text-sm"
              >
                <span className="capitalize">{h.status}</span>
                <span className="text-muted-foreground">
                  {h.note || ""} · {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
