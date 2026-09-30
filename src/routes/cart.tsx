import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, ShoppingBag, ArrowRight, ImageOff } from "lucide-react";
import { getCart, removeFromCart, updateCartItem } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { site, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/cart")({
  loader: async () => {
    const cart = await getCart();
    return cart;
  },
  head: () => ({
    meta: [{ title: pageTitle("Shopping Cart") }],
  }),
  component: CartPage,
});

function CartPage() {
  const initial = Route.useLoaderData() as {
    items: any[];
    subtotal: string;
  };
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initial.items) map[item.id] = item.quantity;
    return map;
  });

  const subtotal = Number(initial.subtotal);
  const itemCount = initial.items.reduce((sum, i) => sum + i.quantity, 0);

  const handleRemove = async (itemId: string) => {
    await removeFromCart({ data: { itemId } });
    // optimistic update handled by revalidation or full reload
    window.location.reload();
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, newQty) }));
    await updateCartItem({ data: { itemId, quantity: Math.max(1, newQty) } });
  };

  if (initial.items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="font-display text-2xl font-black">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Start shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Reveal>
        <h1 className="font-display text-3xl font-black tracking-tight">Shopping Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {initial.items.map((item: any, i: number) => {
            const image = item.product?.image_url || null;
            return (
              <Reveal key={item.id} delay={i * 60}>
                <div className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <Link to={`/shop/product/${item.product?.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {image ? (
                      <img src={image} alt={item.product?.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link to={`/shop/product/${item.product?.slug}`} className="font-display text-sm font-bold hover:text-primary">
                        {item.product?.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        TZS {(Number(item.unit_price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{quantities[item.id] || item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold">Order Summary</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">TZS {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-black">TZS {subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Proceed to checkout <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
