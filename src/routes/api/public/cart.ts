import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cart")({
  server: {
    handlers: {
      async GET() {
        const { db } = await import("@/lib/db.server");
        const cookie = (await import("@tanstack/react-start/server")).getCookie("cart_session");
        const sessionId = cookie || crypto.randomUUID();

        const { data: cart } = await db()
          .from("carts")
          .select("id")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (!cart) {
          return new Response(JSON.stringify({ items: [], subtotal: "0" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const { data: items } = await db()
          .from("cart_items")
          .select(
            "id,product_id,variant_id,quantity,unit_price,product:products(id,title,slug,image_url)",
          )
          .eq("cart_id", cart.id);

        const rows = (items ?? []).map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
          title: i.product?.title ?? "",
          image_url: i.product?.image_url ?? null,
          slug: i.product?.slug ?? "",
        }));

        const subtotal = rows.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

        return new Response(JSON.stringify({ items: rows, subtotal: subtotal.toFixed(2) }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      async POST({ request }) {
        const body = await request.json().catch(() => ({}));
        const { db } = await import("@/lib/db.server");
        const cookie = (await import("@tanstack/react-start/server")).getCookie("cart_session");
        const sessionId = cookie || crypto.randomUUID();
        const action = body.action;

        if (action === "add") {
          const { data: cart } = await db()
            .from("carts")
            .select("id")
            .eq("session_id", sessionId)
            .maybeSingle();
          const cartId = cart?.id || ((await db().from("carts").insert({ session_id: sessionId }).select("id").single()).data?.id);

          const { data: product } = await db()
            .from("products")
            .select("price,title,slug,image_url")
            .eq("id", body.productId)
            .eq("status", "published")
            .maybeSingle();
          if (!product) return new Response(JSON.stringify({ ok: false, error: "Product not found" }), { status: 404 });

          const existing = await db()
            .from("cart_items")
            .select("*")
            .eq("cart_id", cartId)
            .eq("product_id", body.productId)
            .eq("variant_id", body.variantId || "")
            .maybeSingle();

          let item: any;
          if (existing) {
            const newQty = (existing.quantity ?? 0) + (body.quantity || 1);
            await db().from("cart_items").update({ quantity: newQty, unit_price: product.price }).eq("id", existing.id);
            item = { ...existing, quantity: newQty, unit_price: product.price };
          } else {
            const { data: newItem } = await db()
              .from("cart_items")
              .insert({
                cart_id: cartId,
                product_id: body.productId,
                variant_id: body.variantId || null,
                quantity: body.quantity || 1,
                unit_price: product.price,
              })
              .select("id,product_id,variant_id,quantity,unit_price")
              .single();
            item = { ...newItem, title: product.title, image_url: product.image_url, slug: product.slug };
          }

          return new Response(JSON.stringify({ ok: true, item }), {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": `cart_session=${sessionId}; Path=/; HttpOnly`,
            },
          });
        }

        if (action === "update") {
          const { data: cart } = await db()
            .from("carts")
            .select("id")
            .eq("session_id", sessionId)
            .maybeSingle();
          if (!cart) return new Response(JSON.stringify({ ok: false }), { status: 404 });

          if (body.quantity === 0) {
            await db().from("cart_items").delete().eq("id", body.itemId);
          } else {
            await db().from("cart_items").update({ quantity: body.quantity }).eq("id", body.itemId);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        }

        if (action === "remove") {
          const { data: cart } = await db()
            .from("carts")
            .select("id")
            .eq("session_id", sessionId)
            .maybeSingle();
          if (cart) {
            await db().from("cart_items").delete().eq("id", body.itemId);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        }

        if (action === "clear") {
          const { data: cart } = await db()
            .from("carts")
            .select("id")
            .eq("session_id", sessionId)
            .maybeSingle();
          if (cart) {
            await db().from("cart_items").delete().eq("cart_id", cart.id);
            await db().from("carts").delete().eq("id", cart.id);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ ok: false, error: "Invalid action" }), { status: 400 });
      },
    },
  },
});
