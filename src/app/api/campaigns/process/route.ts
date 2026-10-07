import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/api-auth";

import { processCampaignBatch, ProcessorError } from "@/lib/campaign-processor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  if (origin !== expectedOrigin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 }
    );
  }

  const { error } = await requireApiPermission(request, "newsletters.publish");

  if (error) return error;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  if (
    input.confirmed !== true ||
    typeof input.campaignId !== "string" ||
    !input.campaignId.trim()
  ) {
    return NextResponse.json(
      {
        error: "A campaign ID and explicit confirmation are required.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await processCampaignBatch({
      campaignId: input.campaignId.trim(),
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[campaign-process] Processing failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof ProcessorError
            ? error.message
            : "Processing stopped. Inspect delivery records before retrying.",
      },
      {
        status: error instanceof ProcessorError ? error.status : 500,
      }
    );
  }
}
