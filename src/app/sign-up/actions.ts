"use server";

import { hash } from "bcryptjs";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "~/auth";
import { AuthError } from "next-auth";

export async function signUp(email: string, password: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { error: "An account with this email already exists." };
  }
  const passwordHash = await hash(password, 12);
  await db.insert(users).values({
    email,
    passwordHash,
  });
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.message };
    }
    throw e;
  }
  return {};
}
