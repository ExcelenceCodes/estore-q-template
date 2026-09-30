import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, Plus } from "lucide-react";

export const Route = createFileRoute("/seller/dashboard")({
  component: SellerDashboard,
});

function SellerDashboard() {
  const cards = [
    { label: "Post Product", to: "/seller/products/new", icon: Plus },
    { label: "My Products", to: "/seller/products", icon: Package },
    { label: "Manage Orders", to: "/seller/orders", icon: ShoppingCart },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight mb-6">Seller Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
