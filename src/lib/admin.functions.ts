import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { dbProvider } from "./db.server";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  photo_id: string | null;
};

async function guard() {
  const { requireUser } = await import("./auth.server");
  return requireUser();
}

async function client() {
  const { db } = await import("./db.server");
  return db();
}

/* ---------------------------------------------------------------- auth --- */

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { signIn } = await import("./auth.server");
    const user = await signIn(data.email, data.password);
    if (!user) return { ok: false as const, error: "Invalid email or password." };
    return { ok: true as const, user };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { signOut } = await import("./auth.server");
  await signOut();
  return { ok: true };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const { currentUser } = await import("./auth.server");
  return (await currentUser()) as AdminUser | null;
});

/* ---------------------------------------------------------------- media --- */

function toHex(base64: string) {
  const bin = atob(base64);
  let out = "\\x";
  for (let i = 0; i < bin.length; i++) out += bin.charCodeAt(i).toString(16).padStart(2, "0");
  return out;
}

export const uploadMedia = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        filename: z.string().max(200),
        mime: z.string().max(100),
        base64: z.string().max(14_000_000),
        alt: z.string().max(300).optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const bytes = Buffer.from(data.base64, "base64");
    const { data: row, error } = await (
      await client()
    )
      .from("media")
      .insert({
        filename: data.filename,
        mime: data.mime,
        bytes,
        byte_size: bytes.length,
        alt: data.alt ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

/* ------------------------------------------------------------ settings --- */

export const getSetting = createServerFn({ method: "GET" })
  .validator((d: { key: string }) => z.object({ key: z.string().max(60) }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { data: row } = await (
      await client()
    )
      .from("settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    return (row?.value ?? null) as Json;
  });

export const saveSetting = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ key: z.string().max(60), value: z.any() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { error } = await (
      await client()
    )
      .from("settings")
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------ profile --- */

export const saveMyProfile = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(160),
        email: z.string().email().max(200),
        phone: z.string().max(60).nullable().optional(),
        photo_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await guard();
    const c = await client();
    const { error } = await c
      .from("site_users")
      .update({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        phone: data.phone ?? null,
        photo_id: data.photo_id ?? null,
      })
      .eq("id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        oldPassword: z.string().min(1).max(200),
        newPassword: z.string().min(8).max(200),
        confirmPassword: z.string().min(8).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("New passwords do not match.");
    }
    const me = await guard();
    const { hashPassword, verifyPassword } = await import("./auth.server");
    const c = await client();
    const { data: row } = await c
      .from("site_users")
      .select("password_hash")
      .eq("id", me.id)
      .maybeSingle();
    if (!row || !verifyPassword(data.oldPassword, row.password_hash)) {
      throw new Error("Current password is incorrect.");
    }
    const { error } = await c
      .from("site_users")
      .update({ password_hash: hashPassword(data.newPassword) })
      .eq("id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ------------------------------------------------------------ services --- */

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  summary: z.string().max(600).default(""),
  body: z.string().max(40000).default(""),
  icon: z.string().max(60).default("briefcase"),
  image_id: z.string().uuid().nullable().optional(),
  highlights: z.array(z.string().max(200)).default([]),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const adminListServices = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (
      await client()
    )
      .from("services")
      .select("id,slug,title,summary,body,icon,image_id,highlights,order_index,published", {
        count: "exact",
      })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveService = createServerFn({ method: "POST" })
  .validator((d: unknown) => serviceSchema.parse(d))
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload = { ...data, updated_at: new Date().toISOString() };
    const { error } = data.id
      ? await c.from("services").update(payload).eq("id", data.id)
      : await c.from("services").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("services").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------ articles --- */

const articleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(240),
  excerpt: z.string().max(800).default(""),
  body: z.string().max(400000).default(""),
  cover_id: z.string().uuid().nullable().optional(),
  cover_url: z.string().max(600).nullable().optional(),
  tags: z.array(z.string().max(60)).default([]),
  author: z.string().max(120).default("Editorial Team"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const adminListArticles = createServerFn({ method: "GET" })
  .validator((d: { q?: string; status?: string; page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        q: z.string().max(120).optional(),
        status: z.string().max(20).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("articles")
      .select(
        "id,slug,title,excerpt,body,status,author,tags,cover_id,cover_url,published_at,updated_at",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false });
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const adminGetArticle = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { data: row } = await (
      await client()
    )
      .from("articles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    return row;
  });

export const createArticle = createServerFn({ method: "POST" }).handler(async () => {
  await guard();
  const stamp = Date.now().toString(36);
  const { data, error } = await (
    await client()
  )
    .from("articles")
    .insert({ slug: `untitled-${stamp}`, title: "Untitled article", status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
});

export const saveArticle = createServerFn({ method: "POST" })
  .validator((d: unknown) => articleSchema.parse(d))
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    if (data.status === "published") {
      const { data: prev } = await c
        .from("articles")
        .select("published_at")
        .eq("id", data.id ?? "")
        .maybeSingle();
      payload["published_at"] = prev?.published_at ?? new Date().toISOString();
    }
    const { error } = data.id
      ? await c.from("articles").update(payload).eq("id", data.id)
      : await c.from("articles").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("articles").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------- gallery --- */

export const adminListGallery = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; q?: string; category?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        q: z.string().max(120).optional(),
        category: z.string().max(80).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("gallery_photos")
      .select("id,media_id,image_url,caption,category,width,height,posted_on", { count: "exact" })
      .order("posted_on", { ascending: false });
    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`caption.ilike.%${term}%,category.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const savePhoto = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        media_id: z.string().uuid().nullable().optional(),
        image_url: z.string().max(600).nullable().optional(),
        caption: z.string().max(300).default(""),
        category: z.string().max(80).default("General"),
        width: z.number().int().nullable().optional(),
        height: z.number().int().nullable().optional(),
        posted_on: z.string().max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    if (!data.id) {
      const { count } = await c.from("gallery_photos").select("id", { count: "exact", head: true });
      if ((count ?? 0) >= 85) throw new Error("Gallery is full (85 photos maximum).");
    }
    const { error } = data.id
      ? await c.from("gallery_photos").update(data).eq("id", data.id)
      : await c.from("gallery_photos").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("gallery_photos").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------------------------------------------------------- team --- */

export const adminListTeam = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (
      await client()
    )
      .from("team_members")
      .select("id,name,role,bio,photo_id,photo_url,order_index", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveTeamMember = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        role: z.string().max(160).default(""),
        bio: z.string().max(2000).default(""),
        photo_id: z.string().uuid().nullable().optional(),
        photo_url: z.string().max(600).nullable().optional(),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("team_members").update(data).eq("id", data.id)
      : await c.from("team_members").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTeamMember = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("team_members").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------------------------------------------------------- users --- */

export const adminListUsers = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; q?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        q: z.string().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const q = data.q?.trim();

    let query = (await client()).from("site_users").select("*", { count: "exact" });

    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

    const { data: rows, count } = await query
      .order("created_at")
      .range((page - 1) * pageSize, page * pageSize - 1);

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveUser = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        email: z.string().email().max(200),
        phone: z.string().max(60).nullable().optional(),
        role: z.string().max(40).default("editor"),
        photo_id: z.string().uuid().nullable().optional(),
        password: z.string().max(200).optional(),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const { hashPassword } = await import("./auth.server");
    const c = await client();
    const base = {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      phone: data.phone ?? null,
      role: data.role,
      photo_id: data.photo_id ?? null,
      active: data.active,
    };
    if (data.id) {
      const patch: Record<string, unknown> = { ...base };
      if (data.password) patch["password_hash"] = hashPassword(data.password);
      const { error } = await c.from("site_users").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      if (!data.password || data.password.length < 8)
        throw new Error("A password of at least 8 characters is required.");
      const { error } = await c
        .from("site_users")
        .insert({ ...base, password_hash: hashPassword(data.password) });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const me = await guard();
    if (me.id === data.id) throw new Error("You cannot delete your own account.");
    await (await client()).from("site_users").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------- socials --- */

export const adminListSocials = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const { data: rows, count } = await (
      await client()
    )
      .from("socials")
      .select("id,platform,url,enabled,order_index,icon", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveSocials = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        rows: z.array(
          z.object({
            id: z.string().uuid().optional(),
            platform: z.string().min(1).max(60),
            url: z.string().max(400).default(""),
            enabled: z.boolean().default(false),
            order_index: z.number().int().default(0),
            icon: z.string().default("link"),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    if (dbProvider() === "local" && typeof (c as any).transaction === "function") {
      await (c as any).transaction(async (tx: any) => {
        for (const row of data.rows) {
          const { error } = row.id
            ? await tx.from("socials").update(row).eq("id", row.id)
            : await tx.from("socials").insert(row);
          if (error) throw new Error(error.message);
        }
      });
    } else {
      for (const row of data.rows) {
        const { error } = row.id
          ? await c.from("socials").update(row).eq("id", row.id)
          : await c.from("socials").insert(row);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });

export const deleteSocial = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("socials").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------------------------------------- inquiries --- */

export const adminListInquiries = createServerFn({ method: "GET" })
  .validator(
    (d: { page?: number; pageSize?: number; from?: string; to?: string; q?: string } | undefined) =>
      z
        .object({
          page: z.number().int().min(1).optional(),
          pageSize: z.number().int().min(10).max(200).optional(),
          from: z.string().max(20).optional(),
          to: z.string().max(20).optional(),
          q: z.string().max(120).optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    const from = data.from;
    const to = data.to;
    const q = data.q?.trim();

    let query = (await client()).from("inquiries").select("*");

    if (from) query = query.gte("created_at", from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);

    const { data: rows, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const setInquiryHandled = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("inquiries").update({ handled: data.handled }).eq("id", data.id);
    return { ok: true };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("inquiries").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------------------------------------- dashboard --- */

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const c = await client();
  const head = { count: "exact" as const, head: true };
  const [
    services,
    articles,
    drafts,
    photos,
    team,
    users,
    inquiries,
    unread,
    products,
    orders,
    pendingOrders,
  ] = await Promise.all([
    c.from("services").select("id", head),
    c.from("articles").select("id", head).eq("status", "published"),
    c.from("articles").select("id", head).eq("status", "draft"),
    c.from("gallery_photos").select("id", head),
    c.from("team_members").select("id", head),
    c.from("site_users").select("id", head),
    c.from("inquiries").select("id", head),
    c.from("inquiries").select("id", head).eq("handled", false),
    c.from("products").select("id", head),
    c.from("orders").select("id", head),
    c.from("orders").select("id", head).eq("status", "pending"),
  ]);
  const { data: recent } = await c
    .from("inquiries")
    .select("id,name,email,subject,created_at,handled")
    .order("created_at", { ascending: false })
    .limit(5);
  return {
    services: services.count ?? 0,
    articles: articles.count ?? 0,
    drafts: drafts.count ?? 0,
    photos: photos.count ?? 0,
    team: team.count ?? 0,
    users: users.count ?? 0,
    inquiries: inquiries.count ?? 0,
    unread: unread.count ?? 0,
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    recent: recent ?? [],
  };
});

/* ============================================================
   ECOMMERCE — ADMIN: PRODUCTS
   ============================================================ */

export const adminListProducts = createServerFn({ method: "GET" })
  .validator((d: { q?: string; status?: string; page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        q: z.string().max(120).optional(),
        status: z.string().max(20).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("products")
      .select("id,title,slug,sku,price,status,featured,published_at,created_at,updated_at", {
        count: "exact",
      })
      .order("updated_at", { ascending: false });
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%,sku.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(240),
        slug: z.string().min(1).max(240),
        sku: z.string().max(120).nullable().optional(),
        brand_id: z.string().uuid().nullable().optional(),
        description: z.string().max(400000).default(""),
        image_url: z.string().max(600).nullable().optional(),
        price: z.number().positive(),
        compare_at_price: z.number().positive().nullable().optional(),
        cost: z.number().positive().nullable().optional(),
        weight: z.number().nullable().optional(),
        dimensions: z.any().nullable().optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        featured: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    if (data.status === "published" && !data.id) {
      payload["published_at"] = new Date().toISOString();
    }
    const { error } = data.id
      ? await c.from("products").update(payload).eq("id", data.id)
      : await c.from("products").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("products").delete().eq("id", data.id);
    return { ok: true };
  });

/* ============================================================
   ECOMMERCE — ADMIN: CATEGORIES
   ============================================================ */

export const adminListCategories = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 200;
    const { data: rows, count } = await (
      await client()
    )
      .from("product_categories")
      .select("id,name,slug,description,image_id,parent_id,order_index,active", { count: "exact" })
      .order("order_index")
      .range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        parent_id: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(160),
        slug: z.string().min(1).max(160),
        description: z.string().max(2000).default(""),
        image_id: z.string().uuid().nullable().optional(),
        order_index: z.number().int().default(0),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const { error } = await (
      await client()
    )
      .from("product_categories")
      .insert(data)
      .onConflictUpdate()
      .eq("id", data.id!);
    // Fallback if onConflictUpdate is unavailable
    if (error) {
      const c = await client();
      const { error: err2 } = data.id
        ? await c.from("product_categories").update(data).eq("id", data.id)
        : await c.from("product_categories").insert(data);
      if (err2) throw new Error(err2.message);
    }
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("product_categories").delete().eq("id", data.id);
    return { ok: true };
  });

/* ============================================================
   ECOMMERCE — ADMIN: BRANDS
   ============================================================ */

export const adminListBrands = createServerFn({ method: "GET" })
  .validator((d: { page?: number; pageSize?: number; q?: string } | undefined) =>
    z
      .object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
        q: z.string().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("brands")
      .select("id,name,slug,description,website,logo_id,active,order_index", { count: "exact" })
      .order("order_index");
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const saveBrand = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        slug: z.string().min(1).max(160),
        description: z.string().max(4000).default(""),
        website: z.string().max(400).default(""),
        logo_id: z.string().uuid().nullable().optional(),
        active: z.boolean().default(true),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("brands").update(data).eq("id", data.id)
      : await c.from("brands").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrand = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("brands").delete().eq("id", data.id);
    return { ok: true };
  });

export const saveProductCategories = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        categoryIds: z.array(z.string().uuid()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    await (c as any).transaction(async (tx: any) => {
      await tx.from("product_category_assignments").delete().eq("product_id", data.productId);
      for (const categoryId of data.categoryIds) {
        await tx.from("product_category_assignments").insert({
          product_id: data.productId,
          category_id: categoryId,
        });
      }
    });
    return { ok: true };
  });

/* ============================================================
   ECOMMERCE — ADMIN: ORDERS
   ============================================================ */

export const adminListOrders = createServerFn({ method: "GET" })
  .validator((d: { q?: string; status?: string; page?: number; pageSize?: number } | undefined) =>
    z
      .object({
        q: z.string().max(120).optional(),
        status: z.string().max(20).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(10).max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await guard();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 50;
    let query = (await client())
      .from("orders")
      .select(
        "id,order_number,status,payment_status,total,guest_email,guest_name,placed_at,updated_at",
        { count: "exact" },
      )
      .order("placed_at", { ascending: false });
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term)
        query = query.or(
          `order_number.ilike.%${term}%,guest_email.ilike.%${term}%,guest_name.ilike.%${term}%`,
        );
    }
    const { data: rows, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    return {
      rows: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    const { data: order } = await (
      await client()
    )
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await (
      await client()
    )
      .from("order_items")
      .select("*")
      .eq("order_id", data.id);
    const { data: history } = await (
      await client()
    )
      .from("order_status_history")
      .select("*")
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    return { order, items: items ?? [], history: history ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
        note: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload: Record<string, unknown> = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "delivered") payload["fulfilled_at"] = new Date().toISOString();
    if (data.status === "cancelled") payload["cancelled_at"] = new Date().toISOString();
    const { error } = await c.from("orders").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    await c.from("order_status_history").insert({
      order_id: data.id,
      status: data.status,
      note: data.note ?? null,
    });
    return { ok: true };
  });

/* ============================================================
   ECOMMERCE — ADMIN: SPECS + IMAGES + VARIANTS
   ============================================================ */

export const adminListSpecDefinitions = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const { data } = await (
    await client()
  )
    .from("product_spec_definitions")
    .select("*")
    .order("order_index");
  return data ?? [];
});

export const saveSpecDefinition = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        type: z.enum(["text", "textarea", "number", "select", "multiselect", "date", "boolean"]),
        options: z.any().optional(),
        unit: z.string().max(40).optional().nullable(),
        active: z.boolean().default(true),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("product_spec_definitions").update(data).eq("id", data.id)
      : await c.from("product_spec_definitions").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSpecDefinition = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("product_spec_definitions").delete().eq("id", data.id);
    return { ok: true };
  });

export const saveProductImages = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        images: z.array(
          z.object({
            id: z.string().uuid().optional(),
            media_id: z.string().uuid().nullable().optional(),
            image_url: z.string().max(600).nullable().optional(),
            alt_text: z.string().max(300).default(""),
            order_index: z.number().int().min(1).max(5),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const sorted = [...data.images].sort((a, b) => a.order_index - b.order_index);
    const primary = sorted[0];
    await (c as any).transaction(async (tx: any) => {
      await tx.from("product_images").delete().eq("product_id", data.productId);
      for (const img of data.images) {
        await tx.from("product_images").insert({
          product_id: data.productId,
          media_id: img.media_id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          order_index: img.order_index,
        });
      }
      if (primary) {
        const primaryUrl = primary.media_id
          ? `/api/public/media/${primary.media_id}`
          : (primary.image_url ?? null);
        await tx.from("products").update({ image_url: primaryUrl }).eq("id", data.productId);
      }
    });
    return { ok: true };
  });

export const saveProductSpecs = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        specs: z.array(
          z.object({
            spec_definition_id: z.string().uuid(),
            value_text: z.string().optional().nullable(),
            value_number: z.number().optional().nullable(),
            value_date: z.string().optional().nullable(),
            value_boolean: z.boolean().optional().nullable(),
            value_json: z.any().optional().nullable(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    await (c as any).transaction(async (tx: any) => {
      await tx.from("product_spec_values").delete().eq("product_id", data.productId);
      for (const spec of data.specs) {
        const payload: Record<string, unknown> = {
          product_id: data.productId,
          spec_definition_id: spec.spec_definition_id,
        };
        if (spec.value_text !== undefined) payload["value_text"] = spec.value_text;
        if (spec.value_number !== undefined) payload["value_number"] = spec.value_number;
        if (spec.value_date !== undefined)
          payload["value_date"] = spec.value_date ? new Date(spec.value_date).toISOString() : null;
        if (spec.value_boolean !== undefined) payload["value_boolean"] = spec.value_boolean;
        if (spec.value_json !== undefined) payload["value_json"] = spec.value_json;
        await tx.from("product_spec_values").insert(payload);
      }
    });
    return { ok: true };
  });

/* ============================================================
   ECOMMERCE — ADMIN: PROMOTIONS + COUPONS + SHIPPING
   ============================================================ */

export const adminListPromotions = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const { data } = await (await client()).from("promotions").select("*").order("order_index");
  return data ?? [];
});

export const savePromotion = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(240),
        subtitle: z.string().max(500).optional().nullable(),
        image_id: z.string().uuid().nullable().optional(),
        link_url: z.string().max(600).default(""),
        link_label: z.string().max(120).default("Shop Now"),
        active: z.boolean().default(true),
        starts_at: z.string().max(30).optional().nullable(),
        ends_at: z.string().max(30).optional().nullable(),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("promotions").update(data).eq("id", data.id)
      : await c.from("promotions").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePromotion = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("promotions").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminListCoupons = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const { data } = await (await client()).from("coupons").select("*").order("starts_at");
  return data ?? [];
});

export const saveCoupon = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        code: z.string().min(1).max(50),
        type: z.enum(["percentage", "fixed"]),
        value: z.number().positive(),
        min_purchase: z.number().positive().nullable().optional(),
        max_uses: z.number().int().positive().nullable().optional(),
        active: z.boolean().default(true),
        starts_at: z.string().max(30).default(new Date().toISOString()),
        ends_at: z.string().max(30).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const payload = { ...data, code: data.code.toUpperCase() };
    const { error } = data.id
      ? await c.from("coupons").update(payload).eq("id", data.id)
      : await c.from("coupons").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("coupons").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminListShippingMethods = createServerFn({ method: "GET" }).handler(async () => {
  await guard();
  const { data } = await (await client()).from("shipping_methods").select("*").order("order_index");
  return data ?? [];
});

export const saveShippingMethod = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        description: z.string().max(500).optional().nullable(),
        price: z.number().nonnegative(),
        free_threshold: z.number().nonnegative().nullable().optional(),
        active: z.boolean().default(true),
        order_index: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await guard();
    const c = await client();
    const { error } = data.id
      ? await c.from("shipping_methods").update(data).eq("id", data.id)
      : await c.from("shipping_methods").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteShippingMethod = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await guard();
    await (await client()).from("shipping_methods").delete().eq("id", data.id);
    return { ok: true };
  });
