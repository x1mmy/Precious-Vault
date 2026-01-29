"use server";

import { signIn } from "~/auth";
import { AuthError } from "next-auth";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  try {
    const result = (await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
      redirect: false,
    })) as { error?: string } | undefined;
    if (result?.error) {
      return { error: result.error };
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.message };
    }
    throw e;
  }
}
