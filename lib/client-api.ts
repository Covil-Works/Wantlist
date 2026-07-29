"use client";

import { auth } from "@/lib/firebase-client";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function redirectToOnboarding() {
  if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
    window.location.replace("/onboarding");
  }
}

function parseResponse(text: string) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function api(path: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  const data = parseResponse(await res.text());

  if (!res.ok) {
    const message = data.error || "Erro inesperado.";
    if (res.status === 403 && message.includes("Perfil incompleto")) redirectToOnboarding();
    throw new ApiError(message, res.status);
  }

  return data;
}
