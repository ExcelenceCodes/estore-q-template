import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { db } from "./db.server";

const COOKIE = process.env["SESSION_COOKIE_NAME"] || "partner_admin_session";
const DAYS = Number(process.env["SESSION_DAYS"] || 7);

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  photo_id: string | null;
};

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}

function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signIn(email: string, password: string): Promise<AdminUser | null> {
  const client = db();
  const { data: user } = await client
    .from("site_users")
    .select("id,name,email,phone,role,photo_id,password_hash,active")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!user || !user.active || !verifyPassword(password, user.password_hash)) return null;

  const token = newToken();
  const expires = new Date(Date.now() + DAYS * 864e5);
  await client.from("site_sessions").insert({
    token,
    user_id: user.id,
    expires_at: expires.toISOString(),
  });

  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 86400,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    photo_id: user.photo_id,
  };
}

export async function currentUser(): Promise<AdminUser | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;

  const client = db();
  const { data: session } = await client
    .from("site_sessions")
    .select("user_id,expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;

  const { data: user } = await client
    .from("site_users")
    .select("id,name,email,phone,role,photo_id,active")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    photo_id: user.photo_id,
  };
}

export async function requireUser(): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function signOut() {
  const token = getCookie(COOKIE);
  if (token) await db().from("site_sessions").delete().eq("token", token);
  deleteCookie(COOKIE, { path: "/" });
}

/* ============================================================
   CUSTOMER AUTH
   ============================================================ */

const CUSTOMER_COOKIE = process.env["CUSTOMER_SESSION_COOKIE_NAME"] || "customer_session";

export type CustomerSession = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

function newCustomerToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signInCustomer(
  email: string,
  password: string,
): Promise<CustomerSession | null> {
  const client = db();
  const { data: customer } = await client
    .from("customers")
    .select("id,name,email,phone,password_hash,active")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!customer || !customer.active || !verifyPassword(password, customer.password_hash))
    return null;

  const token = newCustomerToken();
  const expires = new Date(Date.now() + 30 * 864e5);
  await client.from("site_sessions").insert({
    token,
    user_id: customer.id,
    expires_at: expires.toISOString(),
  });

  setCookie(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}

export async function currentCustomer(): Promise<CustomerSession | null> {
  const token = getCookie(CUSTOMER_COOKIE);
  if (!token) return null;

  const client = db();
  const { data: session } = await client
    .from("site_sessions")
    .select("user_id,expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;

  const { data: customer } = await client
    .from("customers")
    .select("id,name,email,phone,active")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!customer || !customer.active) return null;
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}

export async function signOutCustomer() {
  const token = getCookie(CUSTOMER_COOKIE);
  if (token) await db().from("site_sessions").delete().eq("token", token);
  deleteCookie(CUSTOMER_COOKIE, { path: "/" });
}
