import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type HeroSlide = {
  url: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HeroSettings = {
  mode: "slideshow" | "solid";
  autoplayMs: number;
  animateText: boolean;
  overlay: number;
  solidToken: string;
  slides: HeroSlide[];
};

export type ContactSettings = {
  companyName: string;
  addressLines: string[];
  phones: string[];
  emails: string[];
  hours: { label: string; value: string }[];
  map: { enabled: boolean; query: string; zoom: number };
};

export type AboutSettings = {
  heading: string;
  paragraphs: string[];
  highlight: string;
  image: string;
  customersServed: number;
};

export type Social = { platform: string; url: string; enabled: boolean };

export type Bootstrap = {
  origin: string;
  hero: HeroSettings;
  contacts: ContactSettings;
  about: AboutSettings;
  socials: Social[];
  hasArticles: boolean;
  hasPhotos: boolean;
  services: { slug: string; title: string }[];
};

async function requestOrigin(): Promise<string> {
  const { requestOrigin: fn } = await import("./origin.server");
  return fn();
}

/* ============================================================
   BOOTSTRAP / EXISTING
   ============================================================ */

export const getBootstrap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Bootstrap> => {
    const { db } = await import("./db.server");
    const client = db();

    const [settings, socials, services, articles, photos] = await Promise.all([
      client.from("settings").select("key,value"),
      client.from("socials").select("platform,url,enabled").order("order_index"),
      client.from("services").select("slug,title").eq("published", true).order("order_index"),
      client.from("articles").select("id").eq("status", "published").limit(1),
      client.from("gallery_photos").select("id").limit(1),
    ]);

    const map = new Map((settings.data ?? []).map((r) => [r.key, r.value]));

    return {
      origin: await requestOrigin(),
      hero: map.get("hero") as HeroSettings,
      contacts: map.get("contacts") as ContactSettings,
      about: map.get("about") as AboutSettings,
      socials: ((socials.data ?? []) as Social[]).filter((s) => s.enabled && s.url),
      hasArticles: (articles.data ?? []).length > 0,
      hasPhotos: (photos.data ?? []).length > 0,
      services: services.data ?? [],
    };
  },
);

/* ============================================================
   SERVICES
   ============================================================ */

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("services")
    .select("id,slug,title,summary,icon,image_id,order_index")
    .eq("published", true)
    .order("order_index");
  return data ?? [];
});

export const getService = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    const { data: service } = await client
      .from("services")
      .select("id,slug,title,summary,body,icon,image_id,highlights")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!service) return null;
    const { data: others } = await client
      .from("services")
      .select("slug,title,summary,icon")
      .eq("published", true)
      .neq("slug", data.slug)
      .order("order_index")
      .limit(3);
    return { service, others: others ?? [] };
  });

/* ============================================================
   ARTICLES
   ============================================================ */

export const listArticles = createServerFn({ method: "GET" })
  .validator((d: { q?: string; page?: number } | undefined) =>
    z
      .object({
        q: z.string().max(120).optional(),
        page: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const pageSize = 6;
    const page = data.page ?? 1;
    let query = db()
      .from("articles")
      .select("id,slug,title,excerpt,cover_url,cover_id,author,tags,published_at", {
        count: "exact",
      })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term)
        query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,body.ilike.%${term}%`);
    }

    const { data: rows, count } = await query;
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const listRecentArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("articles")
    .select("slug,title,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);
  return data ?? [];
});

export const getArticle = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    const { data: article } = await client
      .from("articles")
      .select("id,slug,title,excerpt,body,cover_url,cover_id,author,tags,published_at")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!article) return null;
    const { data: more } = await client
      .from("articles")
      .select("slug,title,excerpt,published_at")
      .eq("status", "published")
      .neq("slug", data.slug)
      .order("published_at", { ascending: false })
      .limit(3);
    return { article, more: more ?? [], origin: await requestOrigin() };
  });

/* ============================================================
   GALLERY
   ============================================================ */

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("gallery_photos")
    .select("id,media_id,image_url,caption,category,width,height,posted_on")
    .order("posted_on", { ascending: false })
    .limit(85);
  return data ?? [];
});

/* ============================================================
   TEAM
   ============================================================ */

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("team_members")
    .select("id,name,role,bio,photo_id,photo_url")
    .order("order_index");
  return data ?? [];
});

/* ============================================================
   INQUIRIES
   ============================================================ */

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        subject: z.string().trim().max(150).default(""),
        message: z.string().trim().min(5).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { error } = await db().from("inquiries").insert(data);
    if (error)
      return { ok: false as const, error: "Your message could not be sent. Please try again." };
    return { ok: true as const };
  });

/* ============================================================
   ECOMMERCE — CATALOG
   ============================================================ */

export const listProducts = createServerFn({ method: "GET" })
  .validator(
    (
      d:
        | {
            q?: string;
            category?: string;
            brand?: string;
            featured?: boolean;
            page?: number;
            pageSize?: number;
          }
        | undefined,
    ) =>
      z
        .object({
          q: z.string().max(120).optional(),
          category: z.string().max(120).optional(),
          brand: z.string().max(120).optional(),
          featured: z.boolean().optional(),
          page: z.number().int().min(1).max(500).optional(),
          pageSize: z.number().int().min(1).max(100).optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const pageSize = data.pageSize ?? 20;
    const page = data.page ?? 1;
    let query = db()
      .from("products")
      .select("id,slug,title,price,compare_at_price,image_url,featured,published_at,brand_id", {
        count: "exact",
      })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (data.featured !== undefined) query = query.eq("featured", data.featured);
    if (data.brand) {
      const { data: brandRow } = await db()
        .from("brands")
        .select("id")
        .eq("slug", data.brand)
        .eq("active", true)
        .maybeSingle();
      if (brandRow) query = query.eq("brand_id", brandRow.id);
    }
    if (data.category) {
      const { data: catRow } = await db()
        .from("product_categories")
        .select("id")
        .eq("slug", data.category)
        .eq("active", true)
        .maybeSingle();
      if (catRow) {
        const { data: childCats } = await db()
          .from("product_categories")
          .select("id")
          .eq("parent_id", catRow.id)
          .eq("active", true);
        const ids = [catRow.id, ...(childCats ?? []).map((c: any) => c.id)];
        const { data: assignments } = await db()
          .from("product_category_assignments")
          .select("product_id")
          .in("category_id", ids);
        const productIds = (assignments ?? []).map((a: any) => a.product_id);
        if (productIds.length === 0) return { rows: [], total: 0, page, pageSize };
        query = query.in("id", productIds);
      }
    }
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term)
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    const { data: rows, count } = await query;
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    const { data: product } = await client
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!product) return null;

    const { data: images } = await client
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("order_index");

    const { data: variants } = await client
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    const { data: specs } = await client
      .from("product_spec_values")
      .select("*, spec_definition:product_spec_definitions(id,name,type,unit)")
      .eq("product_id", product.id);

    return { product, images: images ?? [], variants: variants ?? [], specs: specs ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("product_categories")
    .select("id,name,slug,description,image_id,parent_id,order_index")
    .eq("active", true)
    .order("order_index");
  return data ?? [];
});

export const getCategory = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { data: category } = await db()
      .from("product_categories")
      .select("*")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (!category) return null;
    const { data: children } = await db()
      .from("product_categories")
      .select("id,name,slug,description,image_id,order_index")
      .eq("parent_id", category.id)
      .eq("active", true)
      .order("order_index");
    return { category, children: children ?? [] };
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("brands")
    .select("id,name,slug,description,logo_id,order_index")
    .eq("active", true)
    .order("order_index");
  return data ?? [];
});

export const listPromotions = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("promotions")
    .select("*")
    .eq("active", true)
    .lte("starts_at", new Date().toISOString())
    .or("ends_at.is.null,ends_at.gte." + new Date().toISOString())
    .order("order_index");
  return data ?? [];
});

/* ============================================================
   ECOMMERCE — ENGAGEMENT
   ============================================================ */

export const likeProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string; sessionId?: string; customerId?: string }) =>
    z
      .object({
        productId: z.string().uuid(),
        sessionId: z.string().max(120).optional(),
        customerId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { error } = await db()
      .from("product_likes")
      .insert({
        product_id: data.productId,
        session_id: data.sessionId ?? null,
        customer_id: data.customerId ?? null,
      });
    if (error && !error.message?.includes("duplicate"))
      return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const unlikeProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string; sessionId?: string; customerId?: string }) =>
    z
      .object({
        productId: z.string().uuid(),
        sessionId: z.string().max(120).optional(),
        customerId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const client = db();
    if (data.customerId) {
      await client
        .from("product_likes")
        .delete()
        .eq("product_id", data.productId)
        .eq("customer_id", data.customerId);
    } else if (data.sessionId) {
      await client
        .from("product_likes")
        .delete()
        .eq("product_id", data.productId)
        .eq("session_id", data.sessionId);
    }
    return { ok: true as const };
  });

export const trackProductView = createServerFn({ method: "POST" })
  .validator((d: { productId: string; sessionId: string }) =>
    z.object({ productId: z.string().uuid(), sessionId: z.string().max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    await db().from("product_views").insert({
      product_id: data.productId,
      session_id: data.sessionId,
    });
    return { ok: true as const };
  });

export const getProductEngagement = createServerFn({ method: "GET" })
  .validator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { count: likesCount } = await db()
      .from("product_likes")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId);
    const { count: viewsCount } = await db()
      .from("product_views")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId);
    return { likes: likesCount ?? 0, views: viewsCount ?? 0 };
  });

/* ============================================================
   ECOMMERCE — CUSTOMER AUTH
   ============================================================ */

export const customerRegister = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(160),
        email: z.string().email().max(200),
        password: z.string().min(8).max(200),
        phone: z.string().max(60).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { hashPassword } = await import("./auth.server");
    const { db } = await import("./db.server");
    const { error } = await db()
      .from("customers")
      .insert({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password_hash: hashPassword(data.password),
        phone: data.phone ?? null,
      });
    if (error) return { ok: false as const, error: "Email already registered." };
    return { ok: true as const };
  });

export const customerLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { signInCustomer } = await import("./auth.server");
    const customer = await signInCustomer(data.email, data.password);
    if (!customer) return { ok: false as const, error: "Invalid email or password." };
    return { ok: true as const, customer };
  });

export const customerMe = createServerFn({ method: "GET" }).handler(async () => {
  const { currentCustomer } = await import("./auth.server");
  return (await currentCustomer()) as {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
});

export const requestCustomerVerification = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ type: z.enum(["email", "phone"]), value: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { currentCustomer } = await import("./auth.server");
    const customer = await currentCustomer();
    if (!customer) return { ok: false as const, error: "Not authenticated." };
    const { db } = await import("./db.server");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db().from("customer_verifications").insert({
      customer_id: customer.id,
      type: data.type,
      value: data.value,
      code,
      expires_at: expiresAt,
    });
    return { ok: true as const, code };
  });

/* ============================================================
   ECOMMERCE — CART
   ============================================================ */

export const getOrCreateCart = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { getCartId } = await import("./cart.server");
  const cartId = getCartId();
  const { data: cart } = await db()
    .from("carts")
    .select("id")
    .eq("session_id", cartId)
    .maybeSingle();
  if (cart) return { cartId: cart.id };
  const { data: newCart } = await db()
    .from("carts")
    .insert({ session_id: cartId })
    .select("id")
    .single();
  return { cartId: newCart.id };
});

export const addToCart = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1).default(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { getCartId } = await import("./cart.server");
    const sessionId = getCartId();
    let { data: cart } = await db()
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!cart) {
      const { data: newCart } = await db()
        .from("carts")
        .insert({ session_id: sessionId })
        .select("id")
        .single();
      cart = newCart;
    }
    const { data: product } = await db()
      .from("products")
      .select("price")
      .eq("id", data.productId)
      .eq("status", "published")
      .maybeSingle();
    if (!product) return { ok: false as const, error: "Product not found" };
    const existing = await db()
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("product_id", data.productId)
      .eq("variant_id", data.variantId ?? "")
      .maybeSingle();
    if (existing) {
      await db()
        .from("cart_items")
        .update({ quantity: (existing.quantity ?? 0) + data.quantity, unit_price: product.price })
        .eq("id", existing.id);
    } else {
      await db()
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          product_id: data.productId,
          variant_id: data.variantId ?? null,
          quantity: data.quantity,
          unit_price: product.price,
        });
    }
    return { ok: true as const };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    if (data.quantity === 0) {
      await db().from("cart_items").delete().eq("id", data.itemId);
    } else {
      await db().from("cart_items").update({ quantity: data.quantity }).eq("id", data.itemId);
    }
    return { ok: true as const };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .validator((d: { itemId: string }) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    await db().from("cart_items").delete().eq("id", data.itemId);
    return { ok: true as const };
  });

export const getCart = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { getCartId } = await import("./cart.server");
  const sessionId = getCartId();
  const { data: cart } = await db()
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!cart) return { items: [], subtotal: "0" };
  const { data: items } = await db()
    .from("cart_items")
    .select(
      "id,product_id,variant_id,quantity,unit_price,product:products(id,title,slug,image_url)",
    )
    .eq("cart_id", cart.id);
  const subtotal = (items ?? []).reduce(
    (sum: number, i: any) => sum + Number(i.unit_price) * i.quantity,
    0,
  );
  return { items: items ?? [], subtotal: subtotal.toFixed(2) };
});

/* ============================================================
   ECOMMERCE — CHECKOUT + ORDERS
   ============================================================ */

export const validateCoupon = createServerFn({ method: "POST" })
  .validator((d: { code: string; subtotal: number }) =>
    z.object({ code: z.string().max(50), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { data: coupon } = await db()
      .from("coupons")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("active", true)
      .lte("starts_at", new Date().toISOString())
      .or("ends_at.is.null,ends_at.gte." + new Date().toISOString())
      .maybeSingle();
    if (!coupon) return { ok: false as const, error: "Invalid coupon" };
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
      return { ok: false as const, error: "Coupon exhausted" };
    if (coupon.min_purchase && data.subtotal < Number(coupon.min_purchase))
      return { ok: false as const, error: "Minimum purchase not met" };
    const discount =
      coupon.type === "percentage"
        ? (data.subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);
    return { ok: true as const, discount: Math.min(discount, data.subtotal).toFixed(2), coupon };
  });

export const checkout = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().email().max(255),
        name: z.string().min(1).max(160),
        phone: z.string().max(60).optional(),
        shippingAddress: z.object({}).passthrough(),
        billingAddress: z.object({}).passthrough().optional(),
        shippingMethodId: z.string().uuid().optional().nullable(),
        couponCode: z.string().max(50).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { getCartId } = await import("./cart.server");
    const sessionId = getCartId();
    const { data: cart } = await db()
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!cart) return { ok: false as const, error: "Cart is empty" };
    const { data: items } = await db().from("cart_items").select("*").eq("cart_id", cart.id);
    if (!items?.length) return { ok: false as const, error: "Cart is empty" };

    let discount = 0;
    if (data.couponCode) {
      const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
      const result = await validateCoupon({ data: { code: data.couponCode, subtotal } });
      if (!result.ok) return result;
      discount = Number(result.discount);
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
    const tax = 0;
    let shipping = 0;
    if (data.shippingMethodId) {
      const { data: method } = await db()
        .from("shipping_methods")
        .select("price")
        .eq("id", data.shippingMethodId)
        .maybeSingle();
      if (method) shipping = Number(method.price);
    }
    const total = Math.max(0, subtotal + tax + shipping - discount);

    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase();
    const { data: order, error: orderError } = await db()
      .from("orders")
      .insert({
        order_number: orderNumber,
        guest_email: data.email,
        guest_name: data.name,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        currency: "USD",
        shipping_method_id: data.shippingMethodId ?? null,
        shipping_address: data.shippingAddress,
        billing_address: data.billingAddress ?? data.shippingAddress,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) return { ok: false as const, error: "Could not create order" };

    for (const item of items) {
      await db()
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: "",
          sku: null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: (Number(item.unit_price) * item.quantity).toFixed(2),
        });
    }

    await db().from("carts").delete().eq("id", cart.id);

    return { ok: true as const, orderNumber };
  });

/* ============================================================
   ECOMMERCE — SHIPPING METHODS
   ============================================================ */

export const listShippingMethods = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const { data } = await db()
    .from("shipping_methods")
    .select("id,name,description,price,estimated_days,order_index")
    .eq("active", true)
    .order("order_index");
  return data ?? [];
});

/* ============================================================
   ECOMMERCE — ORDER TRACKING
   ============================================================ */

export const getOrderByNumber = createServerFn({ method: "GET" })
  .validator((d: { orderNumber: string; email: string }) =>
    z.object({ orderNumber: z.string().max(50), email: z.string().email().max(255) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const { data: order } = await db()
      .from("orders")
      .select("*")
      .eq("order_number", data.orderNumber)
      .eq("guest_email", data.email)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await db()
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("id");
    const { data: history } = await db()
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    return { order, items: items ?? [], history: history ?? [] };
  });
