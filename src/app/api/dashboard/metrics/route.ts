import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    activeDrafts: 12,
    sentThisMonth: 8,
    totalRecipients: 4250,
    recipientsChangePercent: 4,
  });
}