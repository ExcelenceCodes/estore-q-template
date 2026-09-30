import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, CreditCard, ShieldCheck } from "lucide-react";
import { checkout, validateCoupon, listShippingMethods } from "@/lib/public.functions";
import { getCart } from "@/lib/public.functions";
import { Reveal } from "@/components/site/Reveal";
import { site, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const cart = await getCart();
    if (!cart.items.length) throw redirect({ to: "/cart" });
    const shipping = await listShippingMethods();
    return { ...cart, shippingMethods: shipping };
  },
  head: () => ({
    meta: [{ title: pageTitle("Checkout") }],
  }),
  component: CheckoutPage,
});

type CheckoutData = {
  items: any[];
  subtotal: string;
  shippingMethods: any[];
};

function CheckoutPage() {
  const initial = Route.useLoaderData() as CheckoutData;
  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    shippingAddress: {
      address: "",
      city: "",
      region: "",
      country: site.seo.geo.country,
      postalCode: "",
    },
    shippingMethodId: "",
    couponCode: "",
    notes: "",
  });
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  const subtotal = Number(initial.subtotal);
  const shippingCost = form.shippingMethodId
    ? initial.shippingMethods.find((m: any) => m.id === form.shippingMethodId)?.price || 0
    : 0;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = async () => {
    setCouponError("");
    try {
      const result = await validateCoupon({
        data: { code: form.couponCode, subtotal },
      });
      if (result.ok) {
        setDiscount(Number(result.discount));
      } else {
        setCouponError(result.error || "Invalid coupon");
        setDiscount(0);
      }
    } catch {
      setCouponError("Something went wrong");
      setDiscount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await checkout({
        data: {
          email: form.email,
          name: form.name,
          phone: form.phone || undefined,
          shippingAddress: form.shippingAddress,
          shippingMethodId: form.shippingMethodId || null,
          couponCode: form.couponCode || null,
          notes: form.notes || null,
        },
      });
      if ((result as any).ok) {
        setOrderNumber((result as any).orderNumber);
        setStep(2);
      } else {
        setError((result as any).error || "Checkout failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (step === 2 && orderNumber) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
        <h1 className="font-display text-3xl font-black">Thank you for your order!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your order has been placed successfully.</p>
        <p className="mt-1 text-sm">
          Order number: <span className="font-mono font-bold">{orderNumber}</span>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={`/order/${orderNumber}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Track order
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-muted"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Reveal>
        <h1 className="font-display text-3xl font-black tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">Complete your order below.</p>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Reveal>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold">Contact Information</h3>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold">Shipping Address</h3>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</label>
                  <input
                    type="text"
                    required
                    value={form.shippingAddress.address}
                    onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, address: e.target.value } })}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</label>
                    <input
                      type="text"
                      required
                      value={form.shippingAddress.city}
                      onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, city: e.target.value } })}
                      className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</label>
                    <input
                      type="text"
                      required
                      value={form.shippingAddress.region}
                      onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, region: e.target.value } })}
                      className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Postal Code</label>
                  <input
                    type="text"
                    value={form.shippingAddress.postalCode}
                    onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, postalCode: e.target.value } })}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold">Shipping Method</h3>
              <div className="mt-4 space-y-2">
                {initial.shippingMethods.map((method: any) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                      form.shippingMethodId === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={form.shippingMethodId === method.id}
                        onChange={(e) => setForm({ ...form, shippingMethodId: e.target.value })}
                        className="border-border"
                      />
                      <div>
                        <p className="text-sm font-medium">{method.name}</p>
                        {method.description && (
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {Number(method.price) === 0 ? "FREE" : `TZS ${Number(method.price).toLocaleString()}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </Reveal>
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
                <span className="font-medium">
                  {shippingCost === 0 ? "FREE" : `TZS ${shippingCost.toLocaleString()}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-TZS {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-black">TZS {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Coupon Code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={form.couponCode}
                  onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                  placeholder="Enter code"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <ShieldCheck size={16} className="text-primary" />
              <span>Secure checkout powered by industry-standard encryption.</span>
            </div>

            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <CreditCard size={16} />
              Place Order — TZS {total.toLocaleString()}
            </button>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
