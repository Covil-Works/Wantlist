import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { extractOpenGraph } from "@/lib/og";

export async function POST(request: Request) {
  await requireProfile();
  const { url } = await request.json();
  try {
    const data = await extractOpenGraph(url);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Falha na extracao." }, { status: 200 });
  }
}
