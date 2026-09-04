"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  buildSessionCookie,
  clearSessionCookie,
  isPinValid,
} from "@/lib/session";

export async function loginWithPin(pin: string): Promise<{ ok: boolean }> {
  if (!isPinValid(pin.replace(/\D/g, ""))) {
    return { ok: false };
  }
  const jar = await cookies();
  const cookie = buildSessionCookie();
  const nameValue = cookie.split(";")[0].trim();
  const eq = nameValue.indexOf("=");
  const name = nameValue.slice(0, eq);
  const value = nameValue.slice(eq + 1);
  jar.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const cookie = clearSessionCookie();
  const nameValue = cookie.split(";")[0];
  const eq = nameValue.indexOf("=");
  jar.set(nameValue.slice(0, eq), "", { path: "/", maxAge: 0 });
  redirect("/login");
}
