import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { extractProductMetadata } from "@/lib/product-metadata/services/product-metadata-extractor";

const extractProductMetadataSchema = z.object({
  url: z.string().trim().min(1).max(1000)
});

export async function POST(request: Request) {
  try {
    await requireProfile();
    const body = extractProductMetadataSchema.parse(await request.json());
    const controller = new AbortController();
    request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    const result = await extractProductMetadata(body.url, { signal: controller.signal });

    if (result.status === "invalid_url") return NextResponse.json({ status: "invalid_url", data: {} }, { status: 400 });
    if (result.status === "redirect_failed") return NextResponse.json({ status: "redirect_failed", data: result.data }, { status: 200 });
    if (result.status === "not_found") return NextResponse.json({ status: "not_found", data: result.data }, { status: 200 });
    if (result.status === "timeout") return NextResponse.json({ status: "timeout", data: result.data }, { status: 200 });

    return NextResponse.json({
      status: result.status,
      data: {
        title: result.data.title,
        description: result.data.description,
        imageUrl: result.data.imageUrl,
        canonicalUrl: result.data.canonicalUrl,
        resolvedUrl: result.data.resolvedUrl,
        storeId: result.data.storeId
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível extrair as informações.";
    return NextResponse.json({ status: "error", data: {}, error: message }, { status: 400 });
  }
}
