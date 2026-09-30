import { getCookie, setCookie } from "@tanstack/react-start/server";

const CART_COOKIE = process.env["CART_COOKIE_NAME"] || "cart_session";

export function getCartId(): string {
  let cartId = getCookie(CART_COOKIE);
  if (!cartId || cartId.length < 16) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    cartId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    setCookie(CART_COOKIE, cartId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 86400,
    });
  }
  return cartId;
}
